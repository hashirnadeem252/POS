// components/common/FormDatePicker.jsx
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  addMonths,
  subMonths,
  addDays,
  setYear,
  setMonth,
  getISOWeek,
} from "date-fns";
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import "../../assets/styles/common/FormDatePicker.css";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function FormDatePicker({
  label,
  name,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  disabled = false,
  helper = null,
  error = null,
  minDate = null,
  maxDate = null,
  className = "",
  markedDates = [],       // optional: array of "yyyy-MM-dd" strings to mark with dots
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [slideDir, setSlideDir] = useState(null); // "left" | "right" | null
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    openUp: false,
    ready: false,
  });

  const selectedDate = (() => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  })();

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selectedDate || new Date())
  );

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // =========================
  // Position calculation
  // =========================
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const POPOVER_WIDTH = 320;
    const POPOVER_HEIGHT = 380;
    const GAP = 8;
    const MARGIN = 16;

    const spaceBelow = viewportHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const openUp = spaceBelow < POPOVER_HEIGHT && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + POPOVER_WIDTH > viewportWidth - MARGIN) {
      left = viewportWidth - POPOVER_WIDTH - MARGIN;
    }
    if (left < MARGIN) left = MARGIN;

    const top = openUp ? rect.top - POPOVER_HEIGHT - GAP : rect.bottom + GAP;

    setPosition({
      top: Math.max(MARGIN, top),
      left,
      openUp,
      ready: true,
    });
  }, []);

  const openPicker = () => {
    if (disabled) return;
    setViewMonth(startOfMonth(selectedDate || new Date()));
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
    setSlideDir(null);
    setPosition((p) => ({ ...p, ready: false }));
  };

  const togglePicker = () => (isOpen ? closePicker() : openPicker());

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => updatePosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const clickedTrigger =
        triggerRef.current && triggerRef.current.contains(e.target);
      const clickedPopover =
        popoverRef.current && popoverRef.current.contains(e.target);
      if (!clickedTrigger && !clickedPopover) closePicker();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) closePicker();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleSelect = (date) => {
    if (onChange) {
      onChange({ target: { name, value: format(date, "yyyy-MM-dd") } });
    }
    closePicker();
  };

  const clearDate = (e) => {
    e.stopPropagation();
    if (onChange) onChange({ target: { name, value: "" } });
  };

  const goToPrevMonth = () => {
    setSlideDir("right");
    setViewMonth(subMonths(viewMonth, 1));
    setTimeout(() => setSlideDir(null), 250);
  };

  const goToNextMonth = () => {
    setSlideDir("left");
    setViewMonth(addMonths(viewMonth, 1));
    setTimeout(() => setSlideDir(null), 250);
  };

  const isDayDisabled = (day) => {
    if (minDate && isBefore(day, parseISO(minDate))) return true;
    if (maxDate && isAfter(day, parseISO(maxDate))) return true;
    return false;
  };

  const isDayMarked = (day) => {
    const key = format(day, "yyyy-MM-dd");
    return markedDates.includes(key);
  };

  // =========================
  // Build grid
  // =========================
  const calendarGrid = (() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  })();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // =========================
  // Popover
  // =========================
  const popover =
    isOpen && position.ready
      ? createPortal(
          <div
            ref={popoverRef}
            className={`dp-popover ${position.openUp ? "open-up" : ""}`}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 99999,
            }}
          >
            {/* ===== Gradient Header ===== */}
            <div className="dp-gradient-header">
              <button
                type="button"
                className="dp-nav-btn dp-nav-prev"
                onClick={goToPrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>

              <div className="dp-header-label">
                <span className="dp-header-month">
                  {MONTHS[viewMonth.getMonth()]}
                </span>
                <select
                  className="dp-header-year"
                  value={viewMonth.getFullYear()}
                  onChange={(e) =>
                    setViewMonth(setYear(viewMonth, Number(e.target.value)))
                  }
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="dp-nav-btn dp-nav-next"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* ===== Weekdays ===== */}
            <div className="dp-weekdays">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="dp-weekday">
                  {d}
                </div>
              ))}
            </div>

            {/* ===== Calendar grid with slide animation ===== */}
            <div className={`dp-grid-wrapper ${slideDir ? `slide-${slideDir}` : ""}`}>
              <div className="dp-grid">
                {calendarGrid.map((week, wi) => (
                  <div key={wi} className="dp-week">
                    {week.map((day) => {
                      const isOutside = !isSameMonth(day, viewMonth);
                      const isSelected =
                        selectedDate && isSameDay(day, selectedDate);
                      const isTodayDate = isToday(day);
                      const dayDisabled = isDayDisabled(day);
                      const marked = isDayMarked(day);

                      const cls = [
                        "dp-day",
                        isOutside && "outside",
                        isSelected && "selected",
                        isTodayDate && !isSelected && "today",
                        dayDisabled && "disabled",
                        marked && "marked",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          className={cls}
                          onClick={() => !dayDisabled && handleSelect(day)}
                          disabled={dayDisabled}
                        >
                          <span className="dp-day-number">
                            {day.getDate()}
                          </span>
                          {marked && <span className="dp-day-dot" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* ===== Quick shortcuts ===== */}
            <div className="dp-shortcuts">
              <button
                type="button"
                className="dp-shortcut-chip"
                onClick={() => handleSelect(new Date())}
              >
                Today
              </button>
              <button
                type="button"
                className="dp-shortcut-chip"
                onClick={() => handleSelect(addDays(new Date(), 1))}
              >
                Tomorrow
              </button>
              <button
                type="button"
                className="dp-shortcut-chip"
                onClick={() => handleSelect(addDays(new Date(), 7))}
              >
                +1 Week
              </button>
              <button
                type="button"
                className="dp-shortcut-chip dp-shortcut-clear"
                onClick={() => {
                  if (onChange) onChange({ target: { name, value: "" } });
                  closePicker();
                }}
              >
                Clear
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  // =========================
  // Trigger
  // =========================
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}

      <div
        ref={triggerRef}
        className={`custom-datepicker-trigger ${isOpen ? "open" : ""} ${
          disabled ? "disabled" : ""
        } ${error ? "has-error" : ""}`}
        onClick={togglePicker}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Calendar size={16} strokeWidth={2} className="datepicker-icon" />

        <span className={`datepicker-value ${!value ? "placeholder" : ""}`}>
          {selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}
        </span>

        {value && !disabled && (
          <button
            type="button"
            className="datepicker-clear"
            onClick={clearDate}
            aria-label="Clear date"
            tabIndex={-1}
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <span className="form-error">{error}</span>}

      {popover}
    </div>
  );
}

export default FormDatePicker;