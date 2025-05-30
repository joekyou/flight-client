import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import FlightCard from '../components/FlightCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatPrice } from '../utils/formatPrice';

const BookingReviewPage = () => {
  const navigate = useNavigate();
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

  if (!selectedOutboundFlight) {
    navigate('/');
    return null;
  }

  const totalPrice = calculateTotalPrice(selectedOutboundFlight, selectedReturnFlight, passengerInfo.length);
  const taxes = totalPrice * 0.1; // 10% tax
  const fees = 25 * passengerInfo.length; // $25 per passenger service fee

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: '/booking/review' }
      });
      return;
    }

    // Store booking data in localStorage for payment page
      const bookingData = {
        flightId: selectedOutboundFlight.id,
        returnFlightId: selectedReturnFlight?.id,
        passengers: passengerInfo.map(p => ({
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone || null
        })),
        numberOfPassengers: passengerInfo.length,
        totalPrice: totalPrice,
        outboundFlight: {
          ...selectedOutboundFlight,
          type: 'OUTBOUND'
        },
        returnFlight: selectedReturnFlight ? {
          ...selectedReturnFlight,
          type: 'RETURN'
        } : null
      };
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    // Navigate to payment page
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

        {/* Flight Details */}
        <div className="mb-8 space-y-6">
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

        {/* Passenger Information Form */}
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

          {/* Price Summary */}
          <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="text-blue-600 mr-2">💰</span>
              Price Summary
            </h2>
            <div className="space-y-4">
              {/* Outbound Flight */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Outbound Flight</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Base Price ({passengerInfo.length} passengers)</span>
                    <span>{formatPrice(selectedOutboundFlight.price * passengerInfo.length)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxes (10%)</span>
                    <span>{formatPrice(selectedOutboundFlight.price * passengerInfo.length * 0.1)}</span>
                  </div>
                </div>
              </div>

              {/* Return Flight */}
              {selectedReturnFlight && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Return Flight</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Base Price ({passengerInfo.length} passengers)</span>
                      <span>{formatPrice(selectedReturnFlight.price * passengerInfo.length)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxes (10%)</span>
                      <span>{formatPrice(selectedReturnFlight.price * passengerInfo.length * 0.1)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Fees */}
              <div>
                <div className="flex justify-between text-sm">
                  <span>Service Fees ({passengerInfo.length} × $25)</span>
                  <span>{formatPrice(fees)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-3 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
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
