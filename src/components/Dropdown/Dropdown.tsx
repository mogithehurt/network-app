// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { Menu, Dropdown as AntdDropdown } from 'antd';
import { Typography } from '@subql/react-ui';
import styles from './Dropdown.module.css';
import clsx from 'clsx';
import { AiOutlineDown } from 'react-icons/ai';

export type keyPair = {
  key: string;
  label: string;
};

interface DropdownProps {
  menu: Array<keyPair>;
  menuItem?: (pair: keyPair) => React.ReactNode | string;
  dropdownContent?: React.ReactNode | string;
  handleOnClick?: (key: string) => void;
}

export const Dropdown: React.VFC<DropdownProps> = ({ menu, menuItem, dropdownContent, handleOnClick }) => {
  const menuList = (
    <Menu>
      {menu.map((menu) => (
        <Menu.Item key={menu.key} onClick={() => handleOnClick && handleOnClick(menu.key)}>
          {typeof menuItem === 'string' || !menuItem ? <Typography>{menu.label}</Typography> : menuItem}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <AntdDropdown overlay={menuList} className={clsx(styles.hosted, 'flex-center')}>
      {typeof dropdownContent === 'string' || !dropdownContent ? (
        <Typography>
          {dropdownContent || 'Menu'} <AiOutlineDown className={styles.downIcon} />
        </Typography>
      ) : (
        dropdownContent
      )}
    </AntdDropdown>
  );
};
