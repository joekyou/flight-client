import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatDateTime } from '../utils/formatDate';
import { formatPrice } from '../utils/formatPrice';

const BookingStatus = ({ status }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {status}
    </span>
  );
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { bookings, loading, error, loadBookings, getUpcomingBookings, getPastBookings } = useBooking();
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/bookings' } });
      return;
    }

    loadBookings();
  }, [isAuthenticated, navigate, loadBookings]);

  const displayBookings = activeTab === 'upcoming' ? getUpcomingBookings() : getPastBookings();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        {error && (
          <ErrorMessage
            message={error}
            className="mb-6"
          />
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Past
            </button>
          </nav>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {displayBookings.length > 0 ? (
            displayBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="px-6 py-4 bg-blue-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Booking Reference: <span className="font-medium">{booking.reference}</span>
                      </h3>
                    </div>
                    <BookingStatus status={booking.status} />
                  </div>
                </div>

                {/* Outbound Flight Details */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Outbound Flight</h4>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="text-base font-medium">{booking.flight.departure}</p>
                      <p className="text-base font-medium">{formatDateTime(booking.flight.departureTime)}</p>
                    </div>
                    <div className="flex-1 mx-4 border-t border-gray-300 border-dashed relative">
                      <div className="absolute inset-y-0 left-0 flex items-center justify-center w-3 h-3 -mt-1.5 rounded-full bg-blue-500" />
                      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-3 h-3 -mt-1.5 rounded-full bg-blue-500" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">To</p>
                      <p className="text-base font-medium">{booking.flight.destination}</p>
                      <p className="text-base font-medium">{formatDateTime(booking.flight.arrivalTime)}</p>
                    </div>
                  </div>
                </div>

                {/* Return Flight Details */}
                {booking.returnFlight && (
                  <div className="px-6 py-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Return Flight</h4>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">From</p>
                        <p className="text-base font-medium">{booking.returnFlight.departure}</p>
                        <p className="text-base font-medium">{formatDateTime(booking.returnFlight.departureTime)}</p>
                      </div>
                      <div className="flex-1 mx-4 border-t border-gray-300 border-dashed relative">
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-3 h-3 -mt-1.5 rounded-full bg-blue-500" />
                        <div className="absolute inset-y-0 right-0 flex items-center justify-center w-3 h-3 -mt-1.5 rounded-full bg-blue-500" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">To</p>
                        <p className="text-base font-medium">{booking.returnFlight.destination}</p>
                        <p className="text-base font-medium">{formatDateTime(booking.returnFlight.arrivalTime)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div>
                      <p>Passengers: {booking.passengers.length}</p>
                      <p className="font-medium text-gray-900">{formatPrice(booking.totalPrice)}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <img
                  src="/airplane.svg"
                  alt="No bookings"
                  className="w-24 h-24 mx-auto mb-4 opacity-50"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} bookings
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === 'upcoming'
                    ? "You don't have any upcoming flights. Start planning your next adventure!"
                    : "You haven't completed any flights yet. Your travel history will appear here."}
                </p>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Search Flights
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;
