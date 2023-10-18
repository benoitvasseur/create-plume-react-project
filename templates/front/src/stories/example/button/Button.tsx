import React from 'react';
import './button.css';

interface ButtonProps {
  /**
   * Is this the principal call to action on the page?
   */
  primary?: boolean,
  /**
   * What background color to use
   */
  backgroundColor?: string,
  /**
   * How large should the button be?
   */
  size?: 'small' | 'medium' | 'large',
  /**
   * Button contents
   */
  label: string,
  /**
   * Optional click handler
   */
  onClick?: () => void,
}

/**
 * Primary UI component for user interaction
 */
// We disable eslint error on export because it's a sample component
// eslint-disable-next-line import/prefer-default-export
export const Button = (
  {
    primary = false,
    size = 'medium',
    backgroundColor,
    label,
    ...props
  }: ButtonProps,
) => {
  const mode: string = primary ? 'storybook-button--primary' : 'storybook-button--secondary';
  return (
    <button
      type="button"
      className={['storybook-button', `storybook-button--${size}`, mode].join(' ')}
      style={{ backgroundColor }}
      {...props}
    >
      {label}
    </button>
  );
};
