import React, { ReactNode } from "react";
import { useAccount } from "wagmi";
import wagmiConfig from "@/providers/web3/wagmiConfig";
import { Stack } from "react-bootstrap";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function BasicWithdrawDialogBody(
  {
    formattedBalance,
    balanceDescription,
    beforeBalanceChildren
  }: {
    formattedBalance: string,
    balanceDescription?: string,
    beforeBalanceChildren?: ReactNode
  }) {
  const web3Account = useAccount();
  const isCorrectChain = web3Account.chainId === wagmiConfig.chain.id;

  return <>
    <Stack direction="vertical" gap={3}>
      {(web3Account.isConnected && isCorrectChain) && <>
          <span className="fs-6">
              <span className="fw-bolder">Address: </span>
              <span className="text-break">{web3Account.address}</span>
          </span>
      </>}

      <Stack className="web3-connect-button-wrapper">
        <ConnectButton showBalance={false}/>
      </Stack>

      {beforeBalanceChildren}

      <span className="fs-4 mt-3">
        <span className="fw-bolder">{balanceDescription ?? "Your Balance: "}</span>{formattedBalance}
      </span>
    </Stack>
  </>;
}