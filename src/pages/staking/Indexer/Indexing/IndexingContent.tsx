// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Typography } from '@subql/react-ui';
import { Table } from 'antd';
import * as React from 'react';
import styles from './Indexing.module.css';
import { useTranslation } from 'react-i18next';
import { OwnDelegator } from '../OwnDelegator';
import { DoStake } from '../DoStake';
import { SetCommissionRate } from '../SetCommissionRate';
import { BsArrowReturnRight } from 'react-icons/bs';
import { UseSortedIndexerReturn } from '../../../../hooks/useSortedIndexer';
import { useWeb3 } from '../../../../containers';

enum SectionTabs {
  Projects = 'Projects',
  Delegator = 'Delegator',
}

const CurAndNextData = ({ item, unit }: any) => {
  return (
    <div>
      <Typography>{item?.current !== undefined ? `${item.current} ${unit || ''}` : '-'}</Typography>
      <div className={styles.nextItem}>
        <div className={styles.nextIcon}>
          <BsArrowReturnRight />
        </div>
        <Typography className={styles.nextValue} variant="medium">
          {item?.after !== undefined ? `${item.after} ${unit || ''}` : '-'}
        </Typography>
      </div>
    </div>
  );
};

interface Props {
  tableData: Array<UseSortedIndexerReturn & { capacity: { current: string } }>;
  indexer: string;
}

export const IndexingContent: React.VFC<Props> = ({ tableData, indexer }) => {
  const [curTab, setCurTab] = React.useState<SectionTabs>(SectionTabs.Delegator);
  const { t } = useTranslation();
  const { account } = useWeb3();

  const columns = [
    {
      title: t('indexer.totalStake').toLocaleUpperCase(),
      dataIndex: 'totalStake',
      key: 'totalStake',
      render: (item: any) => <CurAndNextData item={item} unit={'SQT'} />,
    },
    {
      title: t('indexer.ownStake').toLocaleUpperCase(),
      dataIndex: 'ownStake',
      key: 'ownStake',
      render: (item: any) => <CurAndNextData item={item} unit={'SQT'} />,
    },
    {
      title: t('indexer.commission').toLocaleUpperCase(),
      dataIndex: 'commission',
      key: 'commission',
      render: (item: any) => <CurAndNextData item={item} />,
    },
    {
      title: t('indexer.delegated').toLocaleUpperCase(),
      dataIndex: 'totalDelegations',
      key: 'delegated',
      render: (item: any) => <CurAndNextData item={item} unit={'SQT'} />,
    },
    {
      title: t('indexer.capacity').toLocaleUpperCase(),
      dataIndex: 'capacity',
      key: 'capacity',
      render: (item: any) => <CurAndNextData item={item} unit={'SQT'} />,
    },
  ];

  const tabList = [SectionTabs.Projects, SectionTabs.Delegator];

  return (
    <>
      <div className={styles.textGroup}>
        <Typography className={styles.grayText}>{t('indexer.topRowData')}</Typography>
        <Typography className={styles.grayText}>
          <BsArrowReturnRight className={styles.nextIcon} />
          {t('indexer.secondRowData')}
        </Typography>
      </div>

      {account === indexer && (
        <div className={styles.btns}>
          <DoStake />
          <SetCommissionRate />
        </div>
      )}

      <Table columns={columns} dataSource={tableData} pagination={false} />
      {/* TODO Button component */}
      <div>
        <div className={styles.tabList}>
          {tabList.map((tab) => (
            <div key={tab} className={styles.tab} onClick={() => setCurTab(tab)}>
              <Typography className={`${styles.tabText} ${styles.grayText}`}>{tab}</Typography>
              {curTab === tab && <div className={styles.line} />}
            </div>
          ))}
        </div>

        {curTab === SectionTabs.Projects && <div>Projects</div>}
        {curTab === SectionTabs.Delegator && <OwnDelegator indexer={indexer} />}
      </div>
    </>
  );
};