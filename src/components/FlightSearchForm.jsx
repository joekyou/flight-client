import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { getAirports, searchAirports, formatAirportOptions } from '../services/airportApi';
import LoadingSpinner from './LoadingSpinner';

const FlightSearchForm = ({ className = '' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from: null,
    to: null,
    departDate: new Date(),
    returnDate: null,
    passengers: 1,
    isRoundTrip: false
  });

  const [airports, setAirports] = useState([]);

  // 初始化时从后端加载机场列表
  useEffect(() => {
    const loadInitialAirports = async () => {
      try {
        const response = await getAirports();
        const formattedOptions = formatAirportOptions(response);
        setAirports(formattedOptions);
      } catch (error) {
        console.error('Failed to load airports:', error);
      }
    };
    loadInitialAirports();
  }, []);

  // 防抖函数
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // 搜索机场数据
  const handleAirportSearch = debounce(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    try {
      const response = await searchAirports(searchTerm);
      const formattedOptions = formatAirportOptions(response);
      setAirports(formattedOptions);
    } catch (error) {
      console.error('Failed to search airports:', error);
    }
  }, 300);

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.from || !formData.to || !formData.departDate || loading) {
      return;
    }

    setLoading(true);
    try {
      // Format dates to YYYY-MM-DD to avoid timezone issues
      const formatDateToYYYYMMDD = (date) => {
        return date.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
      };

      const searchParams = new URLSearchParams({
        from: formData.from.value,
        to: formData.to.value,
        departDate: formatDateToYYYYMMDD(formData.departDate),
        passengers: formData.passengers
      });

      if (formData.isRoundTrip && formData.returnDate) {
        searchParams.append('returnDate', formatDateToYYYYMMDD(formData.returnDate));
      }

      navigate(`/search?${searchParams.toString()}`);
    } finally {
      // Only reset loading after a short delay to prevent double submissions
      setTimeout(() => setLoading(false), 500);
    }
  };

  // 处理日期变更
  const handleDateChange = (date, type) => {
    setFormData(prev => ({
      ...prev,
      [type]: date,
      // 如果是去程日期，确保返程日期不早于去程日期
      ...(type === 'departDate' && prev.returnDate && date > prev.returnDate
        ? { returnDate: date }
        : {})
    }));
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* From Airport */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <Select
            inputId="from-airport"
            name="from-airport"
            value={formData.from}
            onChange={(selected) => {
              console.log('Selected departure airport:', selected);
              setFormData(prev => ({
                ...prev,
                from: selected
              }));
            }}
            onInputChange={handleAirportSearch}
            options={airports}
            placeholder="Select departure airport"
            className="text-sm"
            classNamePrefix="select"
            required
            isSearchable={true}
            menuPlacement="auto"
            menuPosition="fixed"
          />
        </div>

        {/* To Airport */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <Select
            inputId="to-airport"
            name="to-airport"
            value={formData.to}
            onChange={(selected) => {
              console.log('Selected arrival airport:', selected);
              setFormData(prev => ({
                ...prev,
                to: selected
              }));
            }}
            onInputChange={handleAirportSearch}
            options={airports}
            placeholder="Select arrival airport"
            className="text-sm"
            classNamePrefix="select"
            required
            isSearchable={true}
            menuPlacement="auto"
            menuPosition="fixed"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depart
            </label>
            <DatePicker
              selected={formData.departDate}
              onChange={(date) => handleDateChange(date, 'departDate')}
              minDate={new Date()}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Return
            </label>
            <DatePicker
              selected={formData.returnDate}
              onChange={(date) => handleDateChange(date, 'returnDate')}
              minDate={formData.departDate}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholderText="One way"
              disabled={!formData.isRoundTrip}
            />
          </div>
        </div>

        {/* Round Trip Toggle & Passengers */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="roundTrip"
              checked={formData.isRoundTrip}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                isRoundTrip: e.target.checked,
                returnDate: e.target.checked ? prev.returnDate : null
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="roundTrip" className="ml-2 text-sm text-gray-700">
              Round trip
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="passengers" className="text-sm text-gray-700">
              Passengers:
            </label>
            <select
              id="passengers"
              value={formData.passengers}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                passengers: parseInt(e.target.value)
              }))}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'passenger' : 'passengers'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.from || !formData.to}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              'Search Flights'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

FlightSearchForm.propTypes = {
  className: PropTypes.string
};

export default FlightSearchForm;
