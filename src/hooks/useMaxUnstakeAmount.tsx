// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BigNumber } from 'ethers';

import { AsyncMemoReturn } from './useAsyncMemo';
import { useAsyncMemo, useNetworkClient } from '.';

export function useMaxUnstakeAmount(indexer: string): AsyncMemoReturn<BigNumber | undefined> {
  const networkClient = useNetworkClient();

  return useAsyncMemo(async () => {
    const maxUnstakeAmount = await networkClient?.maxUnstakeAmount(indexer ?? '');
    return maxUnstakeAmount;
  }, [indexer, networkClient]);
}
