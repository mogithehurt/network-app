// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Typography } from '@subql/react-ui';
import { TableProps } from 'antd';
import { FixedType } from 'rc-table/lib/interface';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import i18next from 'i18next';
import styles from './IndexerList.module.css';
import { DoDelegate } from '../../DoDelegate';
import { CurrentEraValue } from '@hooks/useEraValue';
import { useWeb3 } from '@containers';
import { formatEther, getOrderedAccounts, mulToPercentage } from '@utils';

import { GetIndexers_indexers_nodes as Indexer } from '@__generated__/registry/GetIndexers';
import { TokenAmount } from '@components/TokenAmount';
import { ConnectedIndexer } from '@components/IndexerDetails/IndexerName';
import { AntDTable, SearchInput, TableText } from '@components';
import { TableTitle } from '@components/TableTitle';
import { useGetIndexerQuery } from '@subql/react-hooks';

import { useNetworkClient } from '@hooks';
import { ROUTES } from '@utils';
const { DELEGATOR, INDEXER } = ROUTES;

interface SortedIndexerListProps {
  commission: CurrentEraValue<number>;
  totalStake: CurrentEraValue<number>;
  ownStake: CurrentEraValue<number>;
  delegated: CurrentEraValue<number>;
  capacity: CurrentEraValue<number>;
  __typename: 'Indexer';
  address: string;
  metadata: string | null;
  controller: string | null;
}

const getColumns = (
  account: string,
  era: number | undefined,
  viewIndexerDetail: (url: string) => void,
  pageStartIndex: number,
): TableProps<SortedIndexerListProps>['columns'] => [
  {
    title: '#',
    key: 'idx',
    width: 20,
    render: (_: string, __: any, index: number) => <TableText>{pageStartIndex + index + 1}</TableText>,
    onCell: (record: SortedIndexerListProps) => ({
      onClick: () => viewIndexerDetail(record.address),
    }),
  },
  {
    title: <TableTitle title={i18next.t('indexer.title')} />,
    dataIndex: 'address',
    width: 80,
    render: (val: string) =>
      val ? <ConnectedIndexer id={val} account={account} onAddressClick={viewIndexerDetail} /> : <></>,
  },
  {
    title: <TableTitle title={i18next.t('indexer.totalStake')} />,
    children: [
      {
        title: <TableTitle title={i18next.t('general.current')} />,
        dataIndex: ['totalStake', 'current'],
        width: 40,
        render: (value) => <TokenAmount value={formatEther(value, 4)} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
        sorter: (a, b) => a.totalStake.current - b.totalStake.current,
      },
      {
        title: <TableTitle title={i18next.t('general.next')} />,
        dataIndex: ['totalStake', 'after'],

        width: 40,
        render: (value) => <TokenAmount value={formatEther(value, 4)} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
        sorter: (a, b) => (a.totalStake.after ?? 0) - (b.totalStake.after ?? 0),
      },
    ],
  },
  {
    title: <TableTitle title={i18next.t('indexer.ownStake')} />,

    children: [
      {
        title: <TableTitle title={i18next.t('general.current')} />,
        dataIndex: ['ownStake', 'current'],

        width: 40,
        render: (value) => <TokenAmount value={formatEther(value, 4)} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
      },
      {
        title: <TableTitle title={i18next.t('general.next')} />,
        dataIndex: ['ownStake', 'after'],

        width: 40,
        render: (value) => <TokenAmount value={formatEther(value, 4)} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
      },
    ],
  },
  {
    title: <TableTitle title={i18next.t('indexer.delegated')} />,
    children: [
      {
        title: <TableTitle title={i18next.t('general.current')} />,
        dataIndex: ['delegated', 'current'],

        width: 40,
        render: (value) => <TokenAmount value={formatEther(value, 4)} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
      },
      {
        title: <TableTitle title={i18next.t('general.next')} />,
        dataIndex: ['delegated', 'after'],

        width: 40,
        render: (value) => <TokenAmount value={formatEther(value, 4)} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
      },
    ],
  },
  {
    title: <TableTitle title={i18next.t('indexer.commission')} />,
    children: [
      {
        title: <TableTitle title={i18next.t('general.current')} />,
        dataIndex: ['commission', 'current'],

        width: 40,
        render: (value: number) => <TableText content={mulToPercentage(value) || '-'} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
        sorter: (a, b) => (a.commission.current ?? 0) - (b?.commission?.current ?? 0),
      },
      {
        title: <TableTitle title={i18next.t('general.next')} />,
        dataIndex: ['commission', 'after'],

        width: 40,
        render: (value: number) => <TableText content={mulToPercentage(value) || '-'} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
        sorter: (a, b) => (a.commission.after ?? 0) - (b?.commission?.after ?? 0),
      },
    ],
  },
  {
    title: <TableTitle title={i18next.t('indexer.capacity')} />,
    children: [
      {
        title: <TableTitle title={i18next.t('general.current')} />,
        dataIndex: ['capacity', 'current'],
        width: 40,
        render: (value: string) => <TokenAmount value={formatEther(value, 4)} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
      },
      {
        title: <TableTitle title={i18next.t('general.next')} />,
        dataIndex: ['capacity', 'after'],
        width: 40,
        render: (value: string) => <TokenAmount value={formatEther(value, 4)} />,
        onCell: (record) => ({
          onClick: () => viewIndexerDetail(record.address),
        }),
      },
    ],
  },
  {
    title: <TableTitle title={i18next.t('indexer.action')} />,
    dataIndex: 'address',
    fixed: 'right' as FixedType,
    width: 40,
    align: 'center',
    render: (id: string) => {
      if (id === account) return <Typography> - </Typography>;
      return (
        <div className={'flex-start'}>
          <DoDelegate indexerAddress={id} variant="textBtn" />
        </div>
      );
    },
  },
];

interface props {
  indexers?: Indexer[];
  totalCount?: number;
  onLoadMore?: (offset: number) => void;
  era?: number;
}

// TODO: `useGetIndexerQuery` has been used by DoDelegate
// TODO: update indexer detail Page once ready
export const IndexerList: React.VFC<props> = ({ indexers, onLoadMore, totalCount, era }) => {
  const { t } = useTranslation();
  const networkClient = useNetworkClient();
  const { account } = useWeb3();
  const navigate = useNavigate();
  const viewIndexerDetail = (id: string) => navigate(`/${DELEGATOR}/${INDEXER}/${id}`);
  const [pageStartIndex, setPageStartIndex] = React.useState(0);
  const [loadingList, setLoadingList] = React.useState<boolean>();
  const [indexerList, setIndexerList] = React.useState<any>();

  /**
   * SearchInput logic
   */
  const [searchIndexer, setSearchIndexer] = React.useState<string | undefined>();
  const sortedIndexer = useGetIndexerQuery({ variables: { address: searchIndexer ?? '' } });

  const searchedIndexer = React.useMemo(
    () => (sortedIndexer?.data?.indexer ? [sortedIndexer?.data?.indexer] : undefined),
    [sortedIndexer],
  );

  const SearchAddress = () => (
    <div className={styles.indexerSearch}>
      <SearchInput
        onSearch={(value: string) => setSearchIndexer(value)}
        defaultValue={searchIndexer}
        loading={sortedIndexer.loading}
        emptyResult={!searchedIndexer}
      />
    </div>
  );

  /**
   * SearchInput logic end
   */

  /**
   * Sort Indexers
   */

  const rawIndexerList = React.useMemo(() => searchedIndexer ?? indexers ?? [], [indexers, searchedIndexer]);

  React.useEffect(() => {
    getSortedIndexers();
    async function getSortedIndexers() {
      if (rawIndexerList.length > 0) {
        setLoadingList(true);
        const sortedIndexers = await Promise.all(
          rawIndexerList.map((indexer) => {
            return networkClient?.getIndexer(indexer.id);
          }),
        );

        setIndexerList(sortedIndexers);
        setLoadingList(false);
        return sortedIndexers;
      }
    }
  }, [networkClient, rawIndexerList]);

  const orderedIndexerList = React.useMemo(
    () => (indexerList ? getOrderedAccounts(indexerList, 'address', account) : []),
    [account, indexerList],
  );

  /**
   * Sort Indexers logic end
   */

  const columns = getColumns(account ?? '', era, viewIndexerDetail, pageStartIndex);
  const isLoading =
    !(orderedIndexerList?.length > 0) && (loadingList || sortedIndexer.loading || (totalCount && totalCount > 0));

  return (
    <div className={styles.container}>
      <div className={styles.indexerListHeader}>
        <Typography variant="h6" className={styles.title}>
          {t('indexer.amount', { count: totalCount || indexers?.length || 0 })}
        </Typography>
        <SearchAddress />
      </div>

      <AntDTable
        customPagination
        tableProps={{
          columns,
          rowKey: 'address',
          dataSource: [...orderedIndexerList],
          scroll: { x: 1600 },
          loading: isLoading,
        }}
        paginationProps={{
          total: searchedIndexer ? searchedIndexer.length : totalCount,
          onChange: (page, pageSize) => {
            const i = (page - 1) * pageSize;
            setPageStartIndex(i);
            onLoadMore?.(i);
          },
        }}
      />
    </div>
  );
};