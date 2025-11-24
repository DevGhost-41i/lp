import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

interface Preset {
  label: string;
  getValue: () => { start: Date; end: Date };
}

export default function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value.end.getFullYear(), value.end.getMonth(), 1));
  const [tempValue, setTempValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset temp value when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempValue(value);
      setCurrentMonth(new Date(value.end.getFullYear(), value.end.getMonth(), 1));
    }
  }, [isOpen, value]);

  const presets: Preset[] = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { start: today, end: today };
      },
    },
    {
      label: 'Yesterday',
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return { start: yesterday, end: yesterday };
      },
    },
    {
      label: 'Last 7 days',
      getValue: () => {
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        return { start, end };
      },
    },
    {
      label: 'Last 30 days',
      getValue: () => {
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        const start = new Date(end);
        start.setDate(end.getDate() - 29);
        return { start, end };
      },
    },
    {
      label: 'Last 90 days',
      getValue: () => {
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        const start = new Date(end);
        start.setDate(end.getDate() - 89);
        return { start, end };
      },
    },
    {
      label: 'Last month',
      getValue: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start, end };
      },
    },
    {
      label: 'Month to date',
      getValue: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today);
        end.setHours(0, 0, 0, 0);
        return { start, end };
      },
    },
    {
      label: 'Quarter to date',
      getValue: () => {
        const today = new Date();
        const quarter = Math.floor((today.getMonth() + 3) / 3);
        const start = new Date(today.getFullYear(), (quarter - 1) * 3, 1);
        const end = new Date(today);
        end.setHours(0, 0, 0, 0);
        return { start, end };
      },
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const formatDateRange = () => {
    const startStr = formatDate(tempValue.start);
    const endStr = formatDate(tempValue.end);
    if (tempValue.start.getTime() === tempValue.end.getTime()) {
      return startStr;
    }
    return `${startStr} - ${endStr}`;
  };

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getValue();
    setTempValue(range);
    setCurrentMonth(new Date(range.end.getFullYear(), range.end.getMonth(), 1));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -1 : 1;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const renderMonth = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
    const prevMonthYear = monthIndex === 0 ? year - 1 : year;
    const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
    const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextMonthYear = monthIndex === 11 ? year + 1 : year;

    interface DayInfo {
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
    }

    const days: DayInfo[] = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: monthIndex,
        year: year,
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
      });
    }

    const isInRange = (dayInfo: DayInfo) => {
      const date = new Date(dayInfo.year, dayInfo.month, dayInfo.day);
      date.setHours(0, 0, 0, 0);
      const start = new Date(tempValue.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tempValue.end);
      end.setHours(0, 0, 0, 0);
      return date >= start && date <= end;
    };

    const isStart = (dayInfo: DayInfo) => {
      const date = new Date(dayInfo.year, dayInfo.month, dayInfo.day);
      date.setHours(0, 0, 0, 0);
      const start = new Date(tempValue.start);
      start.setHours(0, 0, 0, 0);
      return date.getTime() === start.getTime();
    };

    const isEnd = (dayInfo: DayInfo) => {
      const date = new Date(dayInfo.year, dayInfo.month, dayInfo.day);
      date.setHours(0, 0, 0, 0);
      const end = new Date(tempValue.end);
      end.setHours(0, 0, 0, 0);
      return date.getTime() === end.getTime();
    };

    const handleDayClick = (dayInfo: DayInfo) => {
      const clickedDate = new Date(dayInfo.year, dayInfo.month, dayInfo.day);
      clickedDate.setHours(0, 0, 0, 0);

      const start = new Date(tempValue.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tempValue.end);
      end.setHours(0, 0, 0, 0);

      if (clickedDate < start) {
        setTempValue({ start: clickedDate, end: end });
      } else if (clickedDate > end) {
        setTempValue({ start: start, end: clickedDate });
      } else {
        setTempValue({ start: clickedDate, end: clickedDate });
      }
    };

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-white uppercase text-xs">
            {month.toLocaleString('default', { month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-0.5 hover:bg-[#2C2C2C] rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-0.5 hover:bg-[#2C2C2C] rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={day} className="text-center text-[10px] text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((dayInfo, index) => {
            const inRange = isInRange(dayInfo);
            const start = isStart(dayInfo);
            const end = isEnd(dayInfo);

            if (!dayInfo.isCurrentMonth) {
              return (
                <div
                  key={index}
                  className="aspect-square flex items-center justify-center text-xs text-gray-600"
                >
                  {dayInfo.day}
                </div>
              );
            }

            return (
              <button
                key={index}
                onClick={() => handleDayClick(dayInfo)}
                className={`
                  aspect-square flex items-center justify-center text-xs rounded-full transition-colors relative
                  ${start || end ? 'bg-[#48a77f] text-white z-10' : ''}
                  ${inRange && !start && !end ? 'bg-[#48a77f]/20 text-white' : 'text-white hover:bg-[#2C2C2C]'}
                `}
              >
                {dayInfo.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 bg-[#161616] text-white px-3 py-1.5 rounded-lg border border-[#2C2C2C] hover:border-[#48a77f] focus:outline-none focus:border-[#48a77f] transition-colors text-sm"
      >
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
        <span className="whitespace-nowrap text-xs sm:text-sm">{formatDateRange()}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-[#161616] border border-[#2C2C2C] rounded-lg shadow-xl z-50 flex overflow-hidden w-[480px] max-w-[95vw]">
          {/* Presets Sidebar */}
          <div className="w-36 border-r border-[#2C2C2C] bg-[#1E1E1E]">
            <div className="p-2 space-y-0.5">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-[#2C2C2C] rounded transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            {/* Date Inputs */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 mb-1">Start date</label>
                <div className="border-b border-[#48a77f] pb-1">
                  <span className="text-white font-medium text-xs">{formatDate(tempValue.start)}</span>
                </div>
              </div>
              <div className="text-gray-400 text-xs">-</div>
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 mb-1">End date</label>
                <div className="border-b border-[#2C2C2C] pb-1">
                  <span className="text-white font-medium text-xs">{formatDate(tempValue.end)}</span>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="mb-4">
              {renderMonth(currentMonth)}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#2C2C2C]">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#48a77f] hover:bg-[#3d9166] rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
