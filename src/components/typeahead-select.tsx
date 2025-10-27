'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { inputClass } from '../lib/ui';

export type Option = {
  value: string;
  label: string;
};

type TypeaheadSelectProps = {
  id: string;
  name: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  loadingText?: string;
  emptyText?: string;
};

export function TypeaheadSelect({
  id,
  name,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Search…',
  isLoading = false,
  loadingText = 'Loading…',
  emptyText = 'No matches found'
}: TypeaheadSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${id}-listbox`;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!hasTyped || !normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const valueMatch = option.value.toLowerCase().includes(normalizedQuery);
      const labelMatch = option.label.toLowerCase().includes(normalizedQuery);
      return valueMatch || labelMatch;
    });
  }, [normalizedQuery, options, hasTyped]);

  useEffect(() => {
    if (!required || !inputRef.current) {
      return;
    }

    if (disabled) {
      inputRef.current.setCustomValidity('');
      return;
    }

    if (value) {
      inputRef.current.setCustomValidity('');
    } else {
      inputRef.current.setCustomValidity('Please choose an option');
    }
  }, [required, value, disabled]);

  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
      setHasTyped(false);
    } else if (!value) {
      setQuery('');
      setHasTyped(false);
    }
  }, [selectedOption, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (filteredOptions.length === 0) {
        return -1;
      }

      if (current < 0 || current >= filteredOptions.length) {
        return 0;
      }

      return current;
    });
  }, [filteredOptions]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setQuery(option.label);
    setHasTyped(false);
    setIsOpen(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setHasTyped(true);
    if (!isOpen) {
      setIsOpen(true);
    }

    if (required && inputRef.current) {
      inputRef.current.setCustomValidity('Please choose an option');
    }

    if (selectedOption && selectedOption.label !== nextQuery) {
      onChange('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((current) => {
        const next = current + 1;
        return next >= filteredOptions.length ? 0 : next;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((current) => {
        const next = current - 1;
        return next < 0 ? filteredOptions.length - 1 : next;
      });
      return;
    }

    if (event.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && activeIndex < filteredOptions.length) {
        event.preventDefault();
        handleSelect(filteredOptions[activeIndex]);
      }
      return;
    }

    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
      return;
    }
  };

  const shouldShowDropdown = isOpen && !disabled;

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shouldShowDropdown}
        aria-controls={listboxId}
        aria-activedescendant={
          shouldShowDropdown && activeIndex >= 0 && activeIndex < filteredOptions.length
            ? `${id}-option-${filteredOptions[activeIndex].value}`
            : undefined
        }
        className={clsx(inputClass, 'pr-12')}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => !disabled && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />

      <input type="hidden" name={name} value={value} />

      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 dark:text-slate-500">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {shouldShowDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/85 p-1 shadow-[0_26px_65px_-45px_rgba(15,23,42,0.75)] backdrop-blur-2xl ring-1 ring-white/40 motion-safe:animate-[fade-in-up_0.3s_ease-out] dark:border-slate-700/70 dark:bg-slate-950/75 dark:ring-slate-700/60 dark:shadow-[0_26px_65px_-45px_rgba(2,6,23,0.85)]"
        >
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-300">{loadingText}</div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-300">{emptyText}</div>
          ) : (
            filteredOptions.map((option, index) => {
              const isActive = index === activeIndex;
              const isSelected = option.value === value;
              return (
                <div
                  id={`${id}-option-${option.value}`}
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={clsx(
                    'cursor-pointer rounded-2xl px-3 py-2 text-sm transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800/80 dark:hover:text-slate-100',
                    {
                      'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200': isActive || isSelected,
                      'text-slate-700 dark:text-slate-200': !isActive && !isSelected
                    }
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(option);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {option.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
