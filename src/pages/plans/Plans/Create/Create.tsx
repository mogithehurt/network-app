// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { parseEther } from '@ethersproject/units';
import { Button, Spinner, Typography } from '@subql/react-ui';
import assert from 'assert';
import { Formik, Form } from 'formik';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '../../../../components/TransactionModal';
import { useContracts, usePlanTemplates, useWeb3 } from '../../../../containers';
import { mapAsync, notEmpty, renderAsync } from '../../../../utils';
import { GetPlanTemplates_planTemplates_nodes as Template } from '../../../../__generated__/GetPlanTemplates';
import * as yup from 'yup';
import { constants } from 'ethers';
import { SummaryList } from '../../../../components';
import { useIndexerDeployments } from '../../../../hooks';
import { InputNumber } from 'antd';
import styles from './Create.module.css';
import clsx from 'clsx';

const planSchema = yup.object({
  price: yup.number().defined(),
  deploymentId: yup.string().optional(),
});

type PlanFormData = yup.Asserts<typeof planSchema>;

type FormProps = {
  template: Template;
  onSubmit: (data: PlanFormData) => void | Promise<void>;
  onCancel: () => void;
};

const PlanForm: React.VFC<FormProps> = ({ template, onSubmit, onCancel }) => {
  const { t } = useTranslation();

  const summaryList = [
    {
      label: t('plans.headers.price'),
      val: `${template.period} days`,
    },
    {
      label: t('plans.headers.dailyReqCap'),
      val: ` ${template.dailyReqCap} queries`,
    },
    {
      label: t('plans.headers.rateLimit'),
      val: ` ${template.rateLimit} queries/min`,
    },
  ];

  return (
    <Formik
      initialValues={{
        price: 0,
        deploymentId: '',
      }}
      validationSchema={planSchema}
      onSubmit={onSubmit}
    >
      {({ submitForm, isValid, isSubmitting, setFieldValue }) => (
        <Form>
          <div>
            <SummaryList title={t('plans.create.description')} list={summaryList} />

            {/* TODO: InputNumber extract component */}
            <div className={'fullWidth'}>
              <Typography>{t('plans.create.priceTitle')} </Typography>
              <InputNumber
                id="price"
                name="price"
                addonAfter="SQT"
                defaultValue={0}
                min={0}
                onChange={(value) => setFieldValue('price', value)}
                className={'fullWidth'}
              />
            </div>

            {/* TODO ability to choose deployment */}

            <div className={clsx('flex', 'flex-end', styles.btns)}>
              <Button
                label={t('plans.create.cancel')}
                onClick={onCancel}
                disabled={isSubmitting}
                type="secondary"
                colorScheme="neutral"
                className={styles.btn}
              />
              <Button
                label={t('plans.create.submit')}
                onClick={submitForm}
                loading={isSubmitting}
                disabled={!isValid}
                colorScheme="standard"
              />
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

const Create: React.FC = () => {
  const { t } = useTranslation();
  const { account } = useWeb3();
  const indexerDeployments = useIndexerDeployments(account ?? '');
  console.log('indexerDeployments', indexerDeployments);
  const pendingContracts = useContracts();
  const templates = usePlanTemplates({});

  // TODO get indexed projects and provide option to set one
  const indexedProjects = [];

  const template = templates.data?.planTemplates?.nodes[0];

  const handleCreate = async (amount: string, deploymentId?: string) => {
    const contracts = await pendingContracts;
    assert(contracts, 'Contracts not available');

    if (templates.error) {
      throw templates.error;
    }

    assert(template, 'No plan templates');

    return contracts.planManager.createPlan(parseEther(amount), template.id, deploymentId || constants.HashZero);
  };

  return (
    <TransactionModal
      actions={[{ label: t('plans.create.title'), key: 'create' }]}
      text={{
        title: t('plans.create.title'),
        steps: [t('plans.create.step1'), t('indexer.confirmOnMetamask')],
        failureText: t('plans.create.failureText'),
      }}
      onClick={(params: PlanFormData) => handleCreate(params.price.toString(), params.deploymentId)}
      renderContent={(onSubmit, onCancel, isLoading) =>
        renderAsync(
          mapAsync((d) => d.planTemplates?.nodes.filter(notEmpty)[0], templates),
          {
            error: (e) => <Typography>{`Failed to get plan template: ${e.message}`}</Typography>,
            loading: () => <Spinner />,
            data: (template) => {
              if (!template) {
                return <Typography>No template found</Typography>;
              }
              return <PlanForm template={template} onSubmit={onSubmit} onCancel={onCancel} />;
            },
          },
        )
      }
    />
  );
};

export default Create;
