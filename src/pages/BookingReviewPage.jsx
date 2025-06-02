import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import FlightCard from '../components/FlightCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatPrice } from '../utils/formatPrice';

const BookingReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { selectedOutboundFlight, selectedReturnFlight, createNewBooking, calculateTotalPrice } = useBooking();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passengerInfo, setPassengerInfo] = useState([
    {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  ]);

  React.useEffect(() => {
    // 如果既没有选择出发航班也没有选择返程航班，才返回首页
    if (!selectedOutboundFlight && !selectedReturnFlight) {
      navigate('/');
    }
  }, [selectedOutboundFlight, selectedReturnFlight, navigate]);

  // 如果既没有选择出发航班也没有选择返程航班，不渲染页面
  if (!selectedOutboundFlight && !selectedReturnFlight) {
    return null;
  }

  // 计算出发和返程航班价格分别累加
  const outboundPrice = selectedOutboundFlight ? selectedOutboundFlight.price * passengerInfo.length : 0;
  const returnPrice = selectedReturnFlight ? selectedReturnFlight.price * passengerInfo.length : 0;
  const basePrice = outboundPrice + returnPrice;
  const taxes = basePrice * 0.1; // 10% tax
  const fees = 25 * passengerInfo.length; // $25 per passenger service fee
  const totalPrice = basePrice + taxes + fees;

  const handlePassengerInfoChange = (index, field, value) => {
    const newPassengerInfo = [...passengerInfo];
    newPassengerInfo[index] = {
      ...newPassengerInfo[index],
      [field]: value
    };
    setPassengerInfo(newPassengerInfo);
  };

  const addPassenger = () => {
    setPassengerInfo([
      ...passengerInfo,
      { firstName: '', lastName: '', email: '', phone: '' }
    ]);
  };

  const removePassenger = (index) => {
    if (passengerInfo.length > 1) {
      const newPassengerInfo = passengerInfo.filter((_, i) => i !== index);
      setPassengerInfo(newPassengerInfo);
    }
  };

  const handleCancel = () => {
    const { outboundFlights = [], returnFlights = [] } = location.state || {};
    const currentSearch = window.location.search;

    navigate({
      pathname: '/search',
      search: currentSearch
    }, { 
      state: { 
        preserveSelection: true,
        selectedOutboundFlight,
        selectedReturnFlight,
        outboundFlights: outboundFlights.length > 0 ? outboundFlights : [selectedOutboundFlight],
        returnFlights: returnFlights.length > 0 ? returnFlights : (selectedReturnFlight ? [selectedReturnFlight] : []),
        searchCriteria: {
          from: searchParams.get('from'),
          to: searchParams.get('to'),
          departDate: searchParams.get('departDate'),
          returnDate: searchParams.get('returnDate'),
          passengers: searchParams.get('passengers')
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: '/booking/review' }
      });
      return;
    }

    // 处理航班信息
    let flightId, returnFlightId, flightType, mainFlightType;

    if (selectedOutboundFlight && selectedReturnFlight) {
      // 往返航班
      flightId = selectedOutboundFlight.id;
      returnFlightId = selectedReturnFlight.id;
      flightType = 'ROUND_TRIP';
      mainFlightType = 'OUTBOUND';
    } else if (selectedOutboundFlight) {
      // 只选择出发航班
      flightId = selectedOutboundFlight.id;
      returnFlightId = null;
      flightType = 'ONE_WAY';
      mainFlightType = 'OUTBOUND';
    } else {
      // 只选择返程航班
      flightId = selectedReturnFlight.id;
      returnFlightId = null;
      flightType = 'ONE_WAY';
      mainFlightType = 'RETURN';
    }

    const bookingData = {
      flightId,
      returnFlightId,
      passengers: passengerInfo.map(p => ({
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone || null
      })),
      numberOfPassengers: passengerInfo.length,
      totalPrice: totalPrice,
      flightType,
      mainFlightType
    };

    // 调试信息
    console.log('Booking data:', bookingData);
    console.log('Selected outbound flight:', selectedOutboundFlight);
    console.log('Selected return flight:', selectedReturnFlight);
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    navigate('/payment');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Review Your Booking</h1>

        {error && (
          <ErrorMessage
            message={error}
            className="mb-6"
          />
        )}

        <div className="mb-8 space-y-6">
          {selectedOutboundFlight && (
            <div className="bg-white rounded-lg shadow-md p-6 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <span className="text-blue-600 mr-2">✈</span>
                Outbound Flight
              </h2>
              <div className="max-w-3xl mx-auto">
                <FlightCard
                  flight={selectedOutboundFlight}
                  onSelect={() => {}}
                  selected={true}
                />
              </div>
            </div>
          )}

          {selectedReturnFlight && (
            <div className="bg-white rounded-lg shadow-md p-6 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <span className="text-blue-600 mr-2">✈</span>
                Return Flight
              </h2>
              <div className="max-w-3xl mx-auto">
                <FlightCard
                  flight={selectedReturnFlight}
                  onSelect={() => {}}
                  selected={true}
                />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="text-blue-600 mr-2">👤</span>
              Passenger Information
            </h2>

            {passengerInfo.map((passenger, index) => (
              <div key={index} className="mb-6 p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Passenger {index + 1}
                  </h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removePassenger(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={passenger.firstName}
                      onChange={(e) => handlePassengerInfoChange(index, 'firstName', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={passenger.lastName}
                      onChange={(e) => handlePassengerInfoChange(index, 'lastName', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={passenger.email}
                      onChange={(e) => handlePassengerInfoChange(index, 'email', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={passenger.phone}
                      onChange={(e) => handlePassengerInfoChange(index, 'phone', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPassenger}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              + Add Another Passenger
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="text-blue-600 mr-2">💰</span>
              Price Summary
            </h2>
            <div className="space-y-4">
              <div>
                {/* 价格明细 */}
                {selectedOutboundFlight && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Outbound Flight</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Base Price ({passengerInfo.length} passengers)</span>
                        <span>{formatPrice((selectedOutboundFlight.price || 0) * passengerInfo.length)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Taxes (10%)</span>
                        <span>{formatPrice((selectedOutboundFlight.price || 0) * passengerInfo.length * 0.1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReturnFlight && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Return Flight</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Base Price ({passengerInfo.length} passengers)</span>
                        <span>{formatPrice((selectedReturnFlight.price || 0) * passengerInfo.length)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Taxes (10%)</span>
                        <span>{formatPrice((selectedReturnFlight.price || 0) * passengerInfo.length * 0.1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span>Service Fees ({passengerInfo.length} × $25)</span>
                  <span>{formatPrice(fees)}</span>
                </div>
              </div>

              <div className="border-t pt-3 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <span>Continue to Payment</span>
              <span className="ml-2">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingReviewPage;
