import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content goes here</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  ),
};

export const WithoutHeader: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent className="pt-6">
        <p>Card content without header</p>
      </CardContent>
    </Card>
  ),
};

export const WithCustomContent: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Project Dashboard</CardTitle>
        <CardDescription>View your project metrics and progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Progress</span>
            <span>75%</span>
          </div>
          <div className="flex justify-between">
            <span>Tasks</span>
            <span>12/16</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">View Details</button>
          <button className="px-4 py-2 border border-gray-300 rounded">Edit</button>
        </div>
      </CardFooter>
    </Card>
  ),
};
