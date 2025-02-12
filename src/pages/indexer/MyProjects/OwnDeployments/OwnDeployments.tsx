// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import DoAllocate from '@components/DoAllocate/DoAllocate';
import { BalanceLayout } from '@pages/dashboard';
import { DoStake } from '@pages/indexer/MyStaking/DoStake';
import { Spinner, SubqlCard, Typography } from '@subql/components';
import { TableTitle } from '@subql/components';
import {
  formatSQT,
  mergeAsync,
  useAsyncMemo,
  useGetAllocationRewardsByDeploymentIdAndIndexerIdQuery,
} from '@subql/react-hooks';
import { getDeploymentStatus } from '@utils/getIndexerStatus';
import { retry } from '@utils/retry';
import { Table, TableProps, Tooltip } from 'antd';
import BigNumberJs from 'bignumber.js';
import { BigNumber } from 'ethers';

import { useWeb3Store } from 'src/stores';

import { DeploymentInfo, Status } from '../../../../components';
import { Description } from '../../../../components/Description/Description';
import { deploymentStatus } from '../../../../components/Status/Status';
import {
  useIsIndexer,
  useSortedIndexer,
  useSortedIndexerDeployments,
  UseSortedIndexerDeploymentsReturn,
} from '../../../../hooks';
import { formatNumber, renderAsync, TOKEN, truncateToDecimalPlace } from '../../../../utils';
import { ROUTES } from '../../../../utils';
import styles from './OwnDeployments.module.css';

const { PROJECT_NAV } = ROUTES;

interface Props {
  indexer: string;
  emptyList?: React.ReactNode;
  desc?: string | React.ReactNode;
}

export const OwnDeployments: React.FC<Props> = ({ indexer, emptyList, desc }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const indexerDeployments = useSortedIndexerDeployments(indexer);
  const isIndexer = useIsIndexer(indexer);
  const sortedIndexer = useSortedIndexer(indexer || '');
  const { contracts } = useWeb3Store();

  const allocatedRewards = useGetAllocationRewardsByDeploymentIdAndIndexerIdQuery({
    variables: {
      indexerId: indexer || '',
    },
  });

  const runnerAllocation = useAsyncMemo(async () => {
    if (!indexer)
      return {
        used: '0',
        total: '0',
        left: '0',
      };
    const res = await contracts?.stakingAllocation.runnerAllocation(indexer);

    return {
      used: formatSQT(res?.used.toString() || '0'),
      total: formatSQT(res?.total.toString() || '0'),
      left: formatSQT(res?.total.sub(res.used).toString() || '0'),
    };
  }, [indexer]);

  const isOverAllocate = React.useMemo(() => {
    if (!runnerAllocation.data?.used || !runnerAllocation.data?.total) return false;
    return +runnerAllocation.data?.used > +runnerAllocation.data?.total;
  }, [runnerAllocation.data?.used, runnerAllocation.data?.total]);

  const columns: TableProps<UseSortedIndexerDeploymentsReturn>['columns'] = [
    {
      title: 'Project',
      dataIndex: 'deploymentId',
      render: (deploymentId: string, deployment) => (
        <DeploymentInfo deploymentId={deploymentId} project={deployment.projectMeta} />
      ),
      onCell: (record) => {
        return {
          onClick: (_) => {
            if (record.projectId) {
              navigate(`${PROJECT_NAV}/${record.projectId}/overview`);
            }
          },
        };
      },
    },
    {
      title: <TableTitle title={t('general.status')} />,
      dataIndex: 'indexingProgress',
      render: (indexingProgress: number, deployment) => {
        // TODO: will use metric service replace it. hardcode for now.
        const sortedStatus = deployment.status ? getDeploymentStatus(deployment.status, false) : 'NOTINDEXING';

        const { indexingErr } = deployment;
        if (indexingErr)
          return (
            <div>
              <Typography type="danger">Error: </Typography> <Typography type="secondary">{indexingErr}</Typography>
            </div>
          );
        return (
          <div>
            <div>
              <Typography variant="medium" style={{ marginRight: 8 }}>
                {truncateToDecimalPlace(indexingProgress * 100, 2)} %
              </Typography>
              <Status text={sortedStatus} color={deploymentStatus[sortedStatus]} />
            </div>
            {deployment.lastHeight ? (
              <Typography type="secondary" variant="small">
                Current blocks: #{deployment.lastHeight}
              </Typography>
            ) : (
              ''
            )}
          </div>
        );
      },
    },
    {
      title: <TableTitle title="Allocated amount" />,
      dataIndex: 'allocatedAmount',
      render: (allocatedAmount: string) => {
        return (
          <Typography>
            {formatNumber(formatSQT(allocatedAmount || '0'))} {TOKEN}
          </Typography>
        );
      },
    },
    {
      title: <TableTitle title="Total rewards" />,
      dataIndex: 'allocatedTotalRewards',
      render: (allocatedTotalRewards, deployment) => {
        return (
          <Typography>
            {formatNumber(formatSQT(allocatedTotalRewards || '0'))} {TOKEN}
          </Typography>
        );
      },
    },
    {
      title: <TableTitle title={t('general.action')} />,
      dataIndex: 'status',
      render: (status, deployment) => {
        return (
          <div style={{ display: 'flex', gap: 26 }}>
            <DoAllocate
              deploymentId={deployment.deploymentId}
              projectId={deployment.projectId}
              actionBtn={<Typography.Link active>Add Allocation</Typography.Link>}
              onSuccess={() => {
                retry(() => {
                  indexerDeployments.refetch?.();
                });
              }}
              initialStatus="Add"
            ></DoAllocate>

            <DoAllocate
              deploymentId={deployment.deploymentId}
              projectId={deployment.projectId}
              disabled={deployment.allocatedAmount === '0' || !deployment.allocatedAmount}
              actionBtn={
                <Typography
                  type={deployment.allocatedAmount === '0' || !deployment.allocatedAmount ? 'secondary' : 'danger'}
                >
                  Remove Allocation
                </Typography>
              }
              onSuccess={() => {
                retry(() => {
                  indexerDeployments.refetch?.();
                });
              }}
              initialStatus="Remove"
            ></DoAllocate>
          </div>
        );
      },
    },
  ];

  const sortedDesc = typeof desc === 'string' ? <Description desc={desc} /> : desc;

  return (
    <div className={styles.container}>
      {renderAsync(
        mergeAsync(indexerDeployments, isIndexer, sortedIndexer, runnerAllocation),

        {
          error: (error) => <Typography type="danger">{`Failed to get projects: ${error.message}`}</Typography>,
          loading: () => <Spinner />,
          data: (data) => {
            const [indexerDepolymentsData, isIndexerData, sortedIndexerData, runnerAllocationData] = data;

            if (!isIndexerData || !sortedIndexerData) {
              return <>{emptyList ?? <Typography> {t('projects.nonDeployments')} </Typography>}</>;
            }

            const sortedData = indexerDepolymentsData?.sort((deployment) => (deployment.isOffline ? 1 : -1));

            const total = BigNumberJs(sortedIndexerData?.ownStake.current || 0)
              .plus(BigNumberJs(sortedIndexerData?.totalDelegations.current || 0))
              .plus(BigNumberJs(runnerAllocationData?.left || 0));
            const renderLineData = {
              ownStake: BigNumberJs(sortedIndexerData?.ownStake.current || 0)
                .div(total)
                .multipliedBy(100)
                .toFixed(2),
              delegation: BigNumberJs(sortedIndexerData?.totalDelegations.current || 0)
                .div(total)
                .multipliedBy(100)
                .toFixed(2),
              unAllocation: BigNumberJs(runnerAllocationData?.left || 0)
                .div(total)
                .multipliedBy(100)
                .toFixed(2),
            };

            return (
              <>
                {sortedDesc && <div className={styles.desc}>{sortedDesc}</div>}
                <div style={{ display: 'flex', gap: 24 }}>
                  <SubqlCard
                    title={
                      <div style={{ width: '100%' }}>
                        <div className="flex">
                          <Typography>Current Total Stake</Typography>
                          <Tooltip title="This is the total staked amount right now. This includes SQT that has been delegated to you">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: 'var(--sq-gray500)' }} />
                          </Tooltip>
                          <span style={{ flex: 1 }}></span>

                          <DoStake
                            onSuccess={() => {
                              retry(() => {
                                sortedIndexer?.refresh?.();
                              });
                            }}
                          ></DoStake>
                        </div>

                        <div>
                          {BalanceLayout({
                            mainBalance: BigNumberJs(sortedIndexerData?.totalStake.current.toString()).toString(),
                            secondaryBalance: BigNumberJs(
                              sortedIndexerData?.totalStake.after?.toString() || '0',
                            ).toString(),
                          })}
                        </div>

                        <div
                          style={{
                            width: '100%',
                            height: 12,
                            borderRadius: 4,
                            margin: '12px 0 20px 0',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: `${renderLineData.ownStake}%`,
                              height: '100%',
                              background: 'var(--sq-blue600)',
                            }}
                          ></div>
                          <div
                            style={{
                              width: `${renderLineData.delegation}%`,
                              height: '100%',
                              background: 'var(--sq-success)',
                            }}
                          ></div>
                          <div
                            style={{
                              width: `${renderLineData.unAllocation}%`,
                              height: '100%',
                              background: 'var(--sq-warning)',
                            }}
                          ></div>
                        </div>

                        <div style={{ display: 'flex', gap: 53 }}>
                          {[
                            {
                              name: 'Own Stake',
                              color: 'var(--sq-blue600)',
                              currentBalance: formatNumber(
                                BigNumberJs(sortedIndexerData?.ownStake.current.toString()).toString(),
                              ),
                              afterBalance: formatNumber(
                                BigNumberJs(sortedIndexerData?.ownStake.after?.toString() || '0').toString(),
                              ),
                            },
                            {
                              name: 'Total Delegation',
                              color: 'var(--sq-success)',
                              currentBalance: formatNumber(
                                BigNumberJs(sortedIndexerData?.totalDelegations.current.toString()).toString(),
                              ),
                              afterBalance: formatNumber(
                                BigNumberJs(sortedIndexerData?.totalDelegations.after?.toString() || '0').toString(),
                              ),
                            },
                            {
                              name: isOverAllocate ? 'Over Allocated' : 'Unallocated Stake',
                              color: 'var(--sq-warning)',
                              currentBalance: formatNumber(runnerAllocationData?.left || '0'),
                              afterBalance: formatNumber(runnerAllocationData?.left || '0'),
                              isOverAllocate: isOverAllocate,
                            },
                          ].map((item) => {
                            return (
                              <div style={{ display: 'flex', alignItems: 'baseline' }} key={item.name}>
                                <div
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: 2,
                                    background: item.color,
                                  }}
                                ></div>
                                <Typography variant="medium" style={{ margin: '0 4px' }}>
                                  {item.name}
                                </Typography>
                                <div className="col-flex" style={{ alignItems: 'flex-end' }}>
                                  <Typography variant="medium">
                                    {item.currentBalance} {TOKEN}
                                    {item.isOverAllocate && (
                                      <Tooltip title="Your current allocation amount exceeds your available stake. Please adjust to align with your available balance. ">
                                        <WarningOutlined style={{ marginLeft: 4, color: 'var(--sq-error)' }} />
                                      </Tooltip>
                                    )}
                                  </Typography>
                                  {!item.isOverAllocate && (
                                    <Typography type="secondary" variant="small">
                                      {item.afterBalance} {TOKEN}
                                    </Typography>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    }
                    style={{ boxShadow: 'none', marginBottom: 24, flex: 1 }}
                  ></SubqlCard>

                  <SubqlCard
                    title={
                      <div>
                        <Typography>Current Total Allocation</Typography>
                      </div>
                    }
                    titleExtra={BalanceLayout({
                      mainBalance: formatNumber(runnerAllocationData?.used || '0'),
                    })}
                    style={{ boxShadow: 'none', marginBottom: 24, flex: 1 }}
                  >
                    <div className="flex">
                      <Typography>Total Allocation Rewards</Typography>
                      <span style={{ flex: 1 }}></span>
                      <Typography>
                        {formatNumber(
                          formatSQT(
                            allocatedRewards.data?.indexerAllocationRewards?.groupedAggregates
                              ?.reduce((cur, add) => cur.plus(add.sum?.reward.toString() || '0'), BigNumberJs(0))
                              .toString() || '0',
                          ),
                        )}{' '}
                        {TOKEN}
                      </Typography>
                    </div>
                  </SubqlCard>
                </div>
                {!indexerDepolymentsData || indexerDepolymentsData.length === 0 ? (
                  <>{emptyList ?? <Typography> {t('projects.nonDeployments')} </Typography>}</>
                ) : (
                  <Table columns={columns} dataSource={sortedData} rowKey={'deploymentId'} />
                )}
              </>
            );
          },
        },
      )}
    </div>
  );
};
