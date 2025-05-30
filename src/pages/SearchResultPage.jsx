import React, { useState, useEffect } from 'react';
import { transformFlights } from '../utils/transformFlightData';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchFlights } from '../services/flightApi';
import FlightCard from '../components/FlightCard';
import FlightSearchForm from '../components/FlightSearchForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useBooking } from '../context/BookingContext';
import { formatDate } from '../utils/formatDate';
import { RadioGroup } from '@headlessui/react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 错误信息映射
const ERROR_MESSAGES = {
  NO_CRITERIA: 'Please provide departure and arrival airports, and travel dates.',
  NO_OUTBOUND: 'No outbound flights found for the selected criteria.',
  NO_RETURN: 'No return flights found for the selected criteria.',
  INVALID_FORMAT: 'Received invalid data format from server.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.'
};

const SearchResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectOutboundFlight, selectReturnFlight } = useBooking();
  
  const [outboundFlights, setOutboundFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOutboundId, setSelectedOutboundId] = useState(null);
  const [selectedReturnId, setSelectedReturnId] = useState(null);
  const [sortBy, setSortBy] = useState('price'); // price, duration, departure

  // 从 URL 参数中获取搜索条件
  const searchCriteria = {
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    departDate: searchParams.get('departDate'),
    returnDate: searchParams.get('returnDate'),
    passengers: parseInt(searchParams.get('passengers') || '1', 10)
  };

  useEffect(() => {
    let mounted = true;
    
  const loadFlights = async () => {
    if (!searchCriteria.from || !searchCriteria.to || !searchCriteria.departDate) {
      setError(ERROR_MESSAGES.NO_CRITERIA);
      toast.error(ERROR_MESSAGES.NO_CRITERIA);
      return;
    }
    
    setLoading(true);
    setError(null);
    setOutboundFlights([]);
    setReturnFlights([]);
    
    try {
      console.log('Searching flights with criteria:', searchCriteria);
      
      // Fetch outbound flights
      const outboundResponse = await searchFlights({
        ...searchCriteria,
        returnDate: null // Ensure one-way search for outbound
      });
      
      if (!outboundResponse || !Array.isArray(outboundResponse)) {
        throw new Error(ERROR_MESSAGES.INVALID_FORMAT);
      }
      
      let returnResponse = null;
      if (searchCriteria.returnDate) {
        console.log('Searching return flights...');
        // Fetch return flights if return date is specified
        returnResponse = await searchFlights({
          from: searchCriteria.to, // Swap from/to for return flight
          to: searchCriteria.from,
          departDate: searchCriteria.returnDate, // Use return date as departure
          passengers: searchCriteria.passengers
        });
        
        if (returnResponse && !Array.isArray(returnResponse)) {
          throw new Error(ERROR_MESSAGES.INVALID_FORMAT);
        }
      }
        
        if (mounted) {
          const transformedOutbound = transformFlights(outboundResponse);
          if (transformedOutbound.length === 0) {
            setError(ERROR_MESSAGES.NO_OUTBOUND);
            toast.warning(ERROR_MESSAGES.NO_OUTBOUND);
          } else {
            console.log('Transformed outbound flights:', transformedOutbound);
            setOutboundFlights(transformedOutbound);
          }
          
          if (returnResponse) {
            const transformedReturn = transformFlights(returnResponse);
            if (transformedReturn.length === 0 && searchCriteria.returnDate) {
              setError(ERROR_MESSAGES.NO_RETURN);
              toast.warning(ERROR_MESSAGES.NO_RETURN);
            } else {
              console.log('Transformed return flights:', transformedReturn);
              setReturnFlights(transformedReturn);
            }
          } else {
            setReturnFlights([]);
          }
        }
      } catch (err) {
        console.error('Error loading flights:', err);
        if (mounted) {
          const errorMessage = err.message === ERROR_MESSAGES.INVALID_FORMAT
            ? ERROR_MESSAGES.INVALID_FORMAT
            : err.name === 'NetworkError'
              ? ERROR_MESSAGES.NETWORK_ERROR
              : err.response?.status === 500
                ? ERROR_MESSAGES.SERVER_ERROR
                : ERROR_MESSAGES.UNKNOWN;
          
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadFlights();

    return () => {
      mounted = false;
    };
  }, [searchCriteria.from, searchCriteria.to, searchCriteria.departDate, searchCriteria.returnDate, searchCriteria.passengers]);

  // Sort flights
  const sortFlights = (flights) => {
    return [...flights].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          return a.duration - b.duration;
        case 'departure':
          return new Date(a.departureTime) - new Date(b.departureTime);
        default:
          return 0;
      }
    });
  };

  const sortedOutboundFlights = sortFlights(outboundFlights);
  const sortedReturnFlights = sortFlights(returnFlights);

  const handleOutboundSelect = (flight) => {
    setSelectedOutboundId(flight.id);
    selectOutboundFlight(flight);
  };

  const handleReturnSelect = (flight) => {
    setSelectedReturnId(flight.id);
    selectReturnFlight(flight);
  };

  const handleReviewClick = () => {
    if (!selectedOutboundId || (searchCriteria.returnDate && !selectedReturnId)) {
      toast.error('Please select both outbound and return flights');
      return;
    }
    navigate('/booking/review');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* 搜索表单 */}
        <div className="mb-8">
          <FlightSearchForm className="shadow-lg" />
        </div>

        {error && (
          <div className="mb-8">
            <ErrorMessage
              message={error}
              className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4"
            />
            <button
              onClick={() => {
                setError(null);
                loadFlights();
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retry Search
            </button>
          </div>
        )}

        {!error && outboundFlights.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">
              No flights found matching your criteria. Try adjusting your search parameters.
            </p>
          </div>
        )}

          {/* Search Results */}
          <div className="space-y-8">
            {/* Outbound Flights */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Outbound Flight
                </h2>
                <p className="text-gray-600">
                  {searchCriteria.from} to {searchCriteria.to} on{' '}
                  {formatDate(searchCriteria.departDate)}
                </p>
              </div>

              {/* Sort Options */}
              <div className="mb-6 flex items-center space-x-4">
                <span className="text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="price">Price</option>
                  <option value="duration">Duration</option>
                  <option value="departure">Departure Time</option>
                </select>
              </div>

              {/* Outbound Flights List */}
              <div className="space-y-4">
                {sortedOutboundFlights.length > 0 ? (
                  <RadioGroup value={selectedOutboundId} onChange={setSelectedOutboundId}>
                    <RadioGroup.Label className="sr-only">Select outbound flight</RadioGroup.Label>
                    <div className="space-y-4">
                      {sortedOutboundFlights.map((flight) => (
                        <RadioGroup.Option key={flight.id} value={flight.id} className="w-full">
                          {({ checked }) => (
                            <FlightCard
                              flight={flight}
                              selected={checked}
                              onSelect={() => handleOutboundSelect(flight)}
                            />
                          )}
                        </RadioGroup.Option>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No outbound flights found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Return Flights */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Return Flight
                </h2>
                {searchCriteria.returnDate && (
                  <p className="text-gray-600">
                    {searchCriteria.to} to {searchCriteria.from} on{' '}
                    {formatDate(searchCriteria.returnDate)}
                  </p>
                )}
              </div>

              {searchCriteria.returnDate ? (
                <div className="space-y-4">
                  {sortedReturnFlights.length > 0 ? (
                    <RadioGroup value={selectedReturnId} onChange={setSelectedReturnId}>
                      <RadioGroup.Label className="sr-only">Select return flight</RadioGroup.Label>
                      <div className="space-y-4">
                        {sortedReturnFlights.map((flight) => (
                          <RadioGroup.Option key={flight.id} value={flight.id} className="w-full">
                            {({ checked }) => (
                              <FlightCard
                                flight={flight}
                                selected={checked}
                                onSelect={() => handleReturnSelect(flight)}
                              />
                            )}
                          </RadioGroup.Option>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No return flights found.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No return flight selected.</p>
                </div>
              )}
            </div>

            {/* Review Button */}
            <div className="flex justify-end">
              <button
                onClick={handleReviewClick}
                disabled={!selectedOutboundId || (searchCriteria.returnDate && !selectedReturnId)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Review Booking
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultPage;
