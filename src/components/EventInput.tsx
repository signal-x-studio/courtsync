import { useState } from 'react';

interface EventInputProps {
  eventId: string;
  date: string;
  timeWindow: number;
  onLoad: (eventId: string, date: string, timeWindow: number) => void;
  loading: boolean;
}

export const EventInput = ({
  eventId,
  date,
  timeWindow,
  onLoad,
  loading,
}: EventInputProps) => {
  const [localEventId, setLocalEventId] = useState(eventId);
  const [localDate, setLocalDate] = useState(date);
  const [localTimeWindow, setLocalTimeWindow] = useState(timeWindow.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const window = parseInt(localTimeWindow, 10);
    if (!isNaN(window) && window > 0) {
      onLoad(localEventId, localDate, window);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="flex-1 min-w-0">
        <label htmlFor="eventId" className="block text-xs mb-1.5" style={{ color: '#9fa2ab' }}>
          Event ID
        </label>
        <input
          id="eventId"
          type="text"
          value={localEventId}
          onChange={(e) => setLocalEventId(e.target.value)}
          className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0"
          style={{ 
            backgroundColor: '#454654', 
            border: '1px solid #525463',
            color: '#f8f8f9',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#eab308';
            e.target.style.boxShadow = '0 0 0 2px rgba(234, 179, 8, 0.5)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#525463';
            e.target.style.boxShadow = 'none';
          }}
          disabled={loading}
        />
      </div>
      <div className="flex-1 sm:min-w-[160px]">
        <label htmlFor="date" className="block text-xs mb-1.5" style={{ color: '#9fa2ab' }}>
          Date
        </label>
        <input
          id="date"
          type="date"
          value={localDate}
          onChange={(e) => setLocalDate(e.target.value)}
          className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0"
          style={{ 
            backgroundColor: '#454654', 
            border: '1px solid #525463',
            color: '#f8f8f9',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#eab308';
            e.target.style.boxShadow = '0 0 0 2px rgba(234, 179, 8, 0.5)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#525463';
            e.target.style.boxShadow = 'none';
          }}
          disabled={loading}
        />
      </div>
      <div className="flex-1 sm:min-w-[120px]">
        <label htmlFor="timeWindow" className="block text-xs mb-1.5" style={{ color: '#9fa2ab' }}>
          Window (min)
        </label>
        <input
          id="timeWindow"
          type="number"
          value={localTimeWindow}
          onChange={(e) => setLocalTimeWindow(e.target.value)}
          min="1"
          className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0"
          style={{ 
            backgroundColor: '#454654', 
            border: '1px solid #525463',
            color: '#f8f8f9',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#eab308';
            e.target.style.boxShadow = '0 0 0 2px rgba(234, 179, 8, 0.5)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#525463';
            e.target.style.boxShadow = 'none';
          }}
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 sm:py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        style={{ 
          backgroundColor: loading ? '#ca8a04' : '#eab308',
          color: '#18181b'
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#ca8a04';
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#eab308';
        }}
      >
        {loading ? 'Loading...' : 'Load'}
      </button>
    </form>
  );
};
