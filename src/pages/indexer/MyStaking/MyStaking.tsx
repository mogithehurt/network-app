// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { AppPageHeader, Card, Description, WalletRoute } from '@components';
import { useWeb3 } from '@containers';
import { useIsIndexer, useSortedIndexer } from '@hooks';
import { Spinner, Typography } from '@subql/components';
import { mergeAsync, renderAsync, TOKEN, truncFormatEtherStr } from '@utils';

import { DoStake } from './DoStake';
import { Indexing, NotRegisteredIndexer } from './Indexing';
import styles from './MyStaking.module.css';
import { SetCommissionRate } from './SetCommissionRate';

export const MyStaking: React.FC = () => {
  const { t } = useTranslation();
  const { account } = useWeb3();
  const isIndexer = useIsIndexer(account);
  const sortedIndexer = useSortedIndexer(account || '');

  return (
    <>
      <AppPageHeader title={t('indexer.myStaking')} />

      <WalletRoute
        componentMode
        element={
          <div className={styles.profile}>
            {renderAsync(mergeAsync(sortedIndexer, isIndexer), {
              loading: () => <Spinner />,
              error: (e) => <Typography>{`Failed to load indexer information: ${e}`}</Typography>,
              data: (data) => {
                if (!data) return null;
                const [sortedIndexerData, indexer] = data;

                if (indexer === undefined && !sortedIndexerData) return <Spinner />;
                if (!indexer && !sortedIndexerData) return <NotRegisteredIndexer />;

                const sortedTotalStaking = truncFormatEtherStr(`${sortedIndexerData?.ownStake.current ?? 0}`);

                return (
                  <>
                    <Description desc={t('indexer.myStakingDesc')} />
                    <div className={styles.stakingHeader}>
                      <div className={styles.stakingAmount}>
                        <Card title={t('indexer.stakingAmountTitle')} value={`${sortedTotalStaking} ${TOKEN}`} />
                      </div>
                      {sortedIndexerData && (
                        <div className={styles.stakingActions}>
                          <DoStake />
                          <div style={{ marginLeft: '1rem' }}>
                            <SetCommissionRate />
                          </div>
                        </div>
                      )}
                    </div>

                    <Indexing tableData={sortedIndexerData} />
                  </>
                );
              },
            })}
          </div>
        }
      ></WalletRoute>
    </>
  );
};
