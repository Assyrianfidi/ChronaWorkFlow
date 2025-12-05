import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Calendar } from './calendar';
import { Card, CardContent, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A calendar component built on react-day-picker with design system styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['single', 'multiple', 'range'],
      description: 'Selection mode for the calendar',
    },
    selected: {
      control: 'object',
      description: 'Selected date(s)',
    },
    disabled: {
      control: 'object',
      description: 'Disabled dates',
    },
    showOutsideDays: {
      control: 'boolean',
      description: 'Show days from previous/next month',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle>Select Date</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={new Date()}
          onSelect={() => {}}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default calendar with single date selection.',
      },
    },
  },
};

export const WithSelection: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    
    return (
      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Date Picker</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          {date && (
            <p className="mt-4 text-sm text-muted-foreground">
              Selected: {date.toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive calendar with date selection functionality.',
      },
    },
  },
};

export const MultipleSelection: Story = {
  render: () => {
    const [dates, setDates] = React.useState<Date[]>([]);
    
    return (
      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Select Multiple Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="multiple"
            selected={dates}
            onSelect={(value) => setDates(value || [])}
            className="rounded-md border"
          />
          {dates.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Selected: {dates.length} date(s)
            </p>
          )}
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar with multiple date selection capability.',
      },
    },
  },
};

export const RangeSelection: Story = {
  render: () => {
    const [range, setRange] = React.useState<{ from: Date; to?: Date }>();
    
    return (
      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="range"
            selected={range}
            onSelect={(value) => {
              if (value && value.from) {
                setRange({ from: value.from, to: value.to });
              }
            }}
            className="rounded-md border"
          />
          {range?.from && (
            <p className="mt-4 text-sm text-muted-foreground">
              {range.from.toLocaleDateString()}
              {range.to && ` - ${range.to.toLocaleDateString()}`}
            </p>
          )}
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar with date range selection functionality.',
      },
    },
  },
};

export const WithDisabledDates: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>();
    const disabled = [
      new Date(2024, 0, 1), // New Year's Day
      new Date(2024, 11, 25), // Christmas
      { dayOfWeek: [0, 6] }, // Weekends
    ];
    
    return (
      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Book Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={disabled}
            className="rounded-md border"
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Weekends and holidays are disabled
          </p>
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar with disabled dates for scheduling use cases.',
      },
    },
  },
};

export const MultipleMonths: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>();
    
    return (
      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Multi-Month View</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Calendar showing multiple months side by side.',
      },
    },
  },
};

export const CustomWeekStart: Story = {
  render: () => (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle>Week Starting Sunday</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={new Date()}
          onSelect={() => {}}
          weekStartsOn={0}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Calendar with week starting on Sunday instead of Monday.',
      },
    },
  },
};

export const FixedWeeks: Story = {
  render: () => (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle>Fixed Height Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={new Date()}
          onSelect={() => {}}
          fixedWeeks
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Calendar with fixed height showing 6 weeks consistently.',
      },
    },
  },
};

export const Minimal: Story = {
  render: () => (
    <Calendar
      mode="single"
      selected={new Date()}
      onSelect={() => {}}
      showOutsideDays={false}
      className="rounded-md border"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Minimal calendar without outside days.',
      },
    },
  },
};
