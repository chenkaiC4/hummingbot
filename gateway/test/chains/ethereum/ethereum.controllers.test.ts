import { BigNumber } from 'ethers';
import { Ethereum } from '../../../src/chains/ethereum/ethereum';
import { patch, unpatch } from '../../services/patch';
import { Token } from '../../../src/services/ethereum-base';
import {
  nonce,
  getTokenSymbolsToTokens,
  allowances,
  approve,
} from '../../../src/chains/ethereum/ethereum.controllers';

let eth: Ethereum;
beforeAll(async () => {
  eth = Ethereum.getInstance();
  await eth.init();
});

afterEach(() => unpatch());

const zeroAddress =
  '0000000000000000000000000000000000000000000000000000000000000000';

describe('nonce', () => {
  it('return a nonce for a wallet', async () => {
    patch(eth, 'getWallet', () => {
      return {
        address: '0xFaA12FD102FE8623C9299c72B03E45107F2772B5',
      };
    });
    patch(eth.nonceManager, 'getNonce', () => 2);
    const n = await nonce(eth, {
      privateKey: zeroAddress,
    });
    expect(n).toEqual({ nonce: 2 });
  });
});

const weth: Token = {
  chainId: 42,
  name: 'WETH',
  symbol: 'WETH',
  address: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
  decimals: 18,
};
describe('getTokenSymbolsToTokens', () => {
  it('return tokens for strings', () => {
    patch(eth, 'getTokenBySymbol', () => {
      return weth;
    });
    expect(getTokenSymbolsToTokens(eth, ['WETH'])).toEqual({ WETH: weth });
  });
});

const uniswap = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

describe('allowances', () => {
  it('return allowances for an owner, spender and tokens', async () => {
    patch(eth, 'getWallet', () => {
      return {
        address: '0xFaA12FD102FE8623C9299c72B03E45107F2772B5',
      };
    });

    patch(eth, 'getTokenBySymbol', () => {
      return weth;
    });

    patch(eth, 'getSpender', () => {
      return uniswap;
    });

    patch(eth, 'getERC20Allowance', () => {
      return {
        value: BigNumber.from('999999999999999999999999'),
        decimals: 2,
      };
    });

    const result = await allowances(eth, {
      privateKey: zeroAddress,
      spender: uniswap,
      tokenSymbols: ['WETH'],
    });
    expect((result as any).approvals).toEqual({
      WETH: '9999999999999999999999.99',
    });
  });
});

describe('approve', () => {
  it('approve a spender for an owner, token and amount', async () => {
    patch(eth, 'getSpender', () => {
      return uniswap;
    });
    eth.getContract = jest.fn().mockReturnValue({
      address: '0xFaA12FD102FE8623C9299c72B03E45107F2772B5',
    });

    patch(eth, 'ready', () => true);

    patch(eth, 'getWallet', () => {
      return {
        address: '0xFaA12FD102FE8623C9299c72B03E45107F2772B5',
      };
    });

    patch(eth, 'getTokenBySymbol', () => {
      return weth;
    });

    patch(eth, 'approveERC20', () => {
      return {
        spender: uniswap,
        value: { toString: () => '9999999' },
      };
    });

    const result = await approve(eth, {
      privateKey: zeroAddress,
      spender: uniswap,
      token: 'WETH',
    });
    expect((result as any).spender).toEqual(uniswap);
  });
});