import type { Meta, StoryObj } from '@storybook/react';
import { RichTextEditor } from './RichTextEditor';

import { useArgs } from '@storybook/preview-api';

const meta: Meta<typeof RichTextEditor> = {
  title: 'Components/UI/RichTextEditor',
  component: RichTextEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    onChange: { action: 'changed' },
    placeholder: { control: 'text' },
    readOnly: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    value: '<p>Hello <strong>world</strong>!</p>',
    placeholder: 'Start typing here...',
    readOnly: false,
  },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs();
    
    const handleChange = (newValue: string) => {
      updateArgs({ value: newValue });
      args.onChange?.(newValue);
    };
    
    return (
      <div className="w-[800px]">
        <RichTextEditor 
          {...args} 
          value={value} 
          onChange={handleChange} 
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: 'This field is required',
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: '<p>This content is read-only</p>',
  },
};

export const WithPlaceholder: Story = {
  args: {
    value: '',
    placeholder: 'Type your content here...',
  },
};
