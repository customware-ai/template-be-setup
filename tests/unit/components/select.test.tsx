import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select } from '~/components/ui/Select';

describe('Select', () => {
  it('renders the trigger as a surfaced field in light mode', () => {
    render(
      <Select
        value="admin"
        options={[
          { label: 'Admin', value: 'admin' },
          { label: 'Viewer', value: 'viewer' },
        ]}
      />,
    );

    const trigger = screen.getByRole('combobox');

    expect(trigger.className).toContain('bg-card');
    expect(trigger.className).toContain('shadow-sm');
    expect(trigger.className).toContain('hover:bg-accent/40');
  });
});
