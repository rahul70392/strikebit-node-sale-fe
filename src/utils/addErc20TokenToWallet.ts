import { Connector, UseAccountReturnType } from "wagmi";
import { getAddress } from "viem";
import { toast } from "react-toastify";

interface WatchAssetParameters {
  type: string // The asset's interface, e.g. 'ERC20'
  options: {
    address: string
    chainId: number
    symbol?: string
    decimals?: number
    image?: string
  }
}

export async function addErc20TokenToWallet(
  web3Connector: Connector,
  erc20Token: {
    address: string,
    decimals: number,
    chainId: number,
  }
) {
  const provider = await web3Connector.getProvider() as any;
  try {
    const wasAdded = await provider.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: getAddress(erc20Token.address),
          chainId: erc20Token.chainId,
          decimals: erc20Token.decimals
        },
      } as WatchAssetParameters,
    });

    if (wasAdded) {
      toast.success("Token added to the wallet!");
    }
  } catch {
    // Ignore
  }
}