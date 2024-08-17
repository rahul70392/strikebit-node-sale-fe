import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import clientApiServices from "@/services/clientApiServices";
import wagmiConfig from "@/providers/web3/wagmiConfig";
import { useAccount } from "wagmi";
import { formatTokenAmountUI } from "@/utils/formatTokenAmountUI";
import { defaultErrorHandler } from "@/utils/defaultErrorHandler";
import { CosmosTokenDto, UserNodesAccountSummaryDto } from "@/generated/distribrain-nodes-api";
import { Alert, FloatingLabel, Form, Spinner, Stack } from "react-bootstrap";
import { DialogConfig, useGenericConfirmationDialog } from "@/components/dialogs/GenericConfirmationDialog";
import commonTerms from "@/data/commonTerms";
import { fromBech32, normalizeBech32 } from "@cosmjs/encoding";
import Link from "next/link";

interface WithdrawDePinKeyPurchaseRewardsDialogOpenProps {
  userNodesSummary: UserNodesAccountSummaryDto | null,
  dePinKeyPurchaseRewardToken: CosmosTokenDto;
  confirmCallback: () => void;
  successCallback: () => void;
  refetchUserSummary: (clearCurrentData: boolean) => Promise<UserNodesAccountSummaryDto | null>;
}

interface WithdrawDePinKeyPurchaseRewardsDialogContextProps {
  open: (openProps: WithdrawDePinKeyPurchaseRewardsDialogOpenProps) => void,
}

export const useWithdrawDePinKeyPurchaseRewardsDialog = (): WithdrawDePinKeyPurchaseRewardsDialogContextProps => {
  const [userNodesSummary, setUserNodesSummary] = useState<UserNodesAccountSummaryDto | null>(null);

  const [openProps, setOpenProps] = useState<WithdrawDePinKeyPurchaseRewardsDialogOpenProps | null>(null);
  const {open: openGenericConfirmationDialog, set: updateGenericConfirmationDialog} = useGenericConfirmationDialog();

  const [address, setAddress] = useState("");
  const isWithdrawalAddressValid = useMemo(() => {
    if (!openProps?.dePinKeyPurchaseRewardToken)
      return;

    try {
      const decodedWalletAddress = fromBech32(normalizeBech32(address));
      return decodedWalletAddress.prefix === openProps.dePinKeyPurchaseRewardToken.chainPrefix;
    } catch (err: any) {
      return false;
    }
  }, [openProps?.dePinKeyPurchaseRewardToken, address]);

  const dePinKeyPurchaseRewardTokenAmount =
    userNodesSummary?.totalDePinKeyPurchaseRewardAvailableTokenAmount ?
      BigInt(userNodesSummary?.totalDePinKeyPurchaseRewardAvailableTokenAmount) :
      null;

  const formattedDePinKeyPurchaseRewardTokenAmount =
    openProps != null && dePinKeyPurchaseRewardTokenAmount != null ?
      `${formatTokenAmountUI(dePinKeyPurchaseRewardTokenAmount, openProps.dePinKeyPurchaseRewardToken.exponent)} ${commonTerms.dePinKeyPurchaseRewardTokenName}` :
      "";

  const handleConfirm = useCallback(async function (confirmCallback?: () => void, successCallback?: () => void) {
    if (!isWithdrawalAddressValid)
      return false;
    
    try {
      confirmCallback?.();

      await clientApiServices.distribrainNodesApi.nodesControllerPostDePinKeyPurchaseRewardsWithdraw({
        address: address
      });
      toast.success(`Successfully withdrawn ${formattedDePinKeyPurchaseRewardTokenAmount} to address ${address}!`);

      successCallback?.();
    } catch (err: any) {
      defaultErrorHandler(err, `Failed to withdraw ${commonTerms.dePinKeyPurchaseRewardTokenName} reward: `);
      return false;
    }

    return true;
  }, [address, isWithdrawalAddressValid, formattedDePinKeyPurchaseRewardTokenAmount]);

  const dialogConfig = useCallback((openProps: WithdrawDePinKeyPurchaseRewardsDialogOpenProps) => {
    const dialogContent = <>
      {!userNodesSummary && <Spinner className="d-block m-auto"/>}
      {userNodesSummary && <>
          <Stack direction="vertical" gap={3}>
              <Alert variant="info" className="mb-2">
                  dVPN token will be withdrawn to your provided wallet on Sentinel chain.
                  <br/>
                  <br/>
                  We suggest using an IBC wallet like <Link href="https://www.keplr.app/" target="_blank">Keplr</Link>.
              </Alert>

              <FloatingLabel
                  controlId="cosmos-address"
                  label="Sentinel address *"
              >
                  <Form.Control
                      required
                      type="text"
                      inputMode="text"
                      isInvalid={!isWithdrawalAddressValid}
                    //disabled={uiDisabled}
                      value={address}
                      onChange={e => setAddress(e.currentTarget.value)}
                    //className={classes.prettyInput}
                  />
                  <Form.Control.Feedback type="invalid">
                    {!isWithdrawalAddressValid && <>
                        Not a valid Sentinel chain address.
                    </>}
                  </Form.Control.Feedback>
              </FloatingLabel>

              <span className="fs-4 mt-3">
                <span className="fw-bolder">Available: </span>{formattedDePinKeyPurchaseRewardTokenAmount}
              </span>
          </Stack>
      </>}
    </>;

    const config: DialogConfig = {
      title: `Withdraw ${commonTerms.dePinKeyPurchaseRewardTokenName} Rewards`,
      content: dialogContent,
      buttons: [
        {
          kind: "confirm",
          title: `Withdraw`,
          disabled: dePinKeyPurchaseRewardTokenAmount == null || dePinKeyPurchaseRewardTokenAmount < 1_000,
          onClick: () => handleConfirm(openProps.confirmCallback, openProps.successCallback)
        }
      ],
      modalFooterProps: {
        className: "justify-content-center"
      }
    }
    return config;
    // NOTE: ignore address
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNodesSummary, isWithdrawalAddressValid, formattedDePinKeyPurchaseRewardTokenAmount, dePinKeyPurchaseRewardTokenAmount, handleConfirm]);

  useEffect(() => {
    if (!openProps)
      return;

    updateGenericConfirmationDialog(dialogConfig(openProps));
  }, [dialogConfig, openProps, updateGenericConfirmationDialog]);

  return {
    open: (openProps: WithdrawDePinKeyPurchaseRewardsDialogOpenProps) => {
      setOpenProps(openProps);
      setUserNodesSummary(null);
      openGenericConfirmationDialog(dialogConfig(openProps));

      openProps.refetchUserSummary(false).then((newSummary) => {
        setUserNodesSummary(newSummary)
      });
    }
  }
}
