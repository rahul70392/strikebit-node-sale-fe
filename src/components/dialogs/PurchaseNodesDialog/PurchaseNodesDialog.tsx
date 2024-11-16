import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Address, erc20Abi } from "viem";
import { toast } from "react-toastify";
import { FloatingLabel, Form, InputGroup, Modal, Stack } from "react-bootstrap";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { uiFloatNumberNiceFormat, uiIntNumberNiceFormat } from "@/utils/uiNiceFormat";
import { calculateFormattedTokenPrice } from "@/utils/bigint/bigIntMathUI";
import wagmiConfig from "@/providers/web3/wagmiConfig";
import classes from "./PurchaseNodesDialog.module.scss";
import { StarIcon } from "@/components/visual/StarIcon";
import { NodesPurchaseButton } from "@/components/dialogs/PurchaseNodesDialog/NodesPurchaseButton";
import { routes } from "@/data/routes";
import useReferralCodeFromQuery from "@/hooks/useReferralCodeFromQuery";
import { NodesTypePurchaseInfoDto } from "@/generated/distribrain-nodes-api";

const showNodeTypesSelection = !!(+process.env.NEXT_PUBLIC_SHOW_NODE_TYPES_SELECTION!);

export interface PurchaseNodesDialogOpenProps {
  referralCodeRequired: boolean;
  nodeTypes: NodesTypePurchaseInfoDto[];
  purchaseTokenAddress: string;
  purchaseTokenDecimals: number;
  isOpen: boolean;
  onClose: () => void;
  purchasedCallback: () => Promise<void>;
}

export const PurchaseNodesDialog = (props: PurchaseNodesDialogOpenProps) => {
  const [isExecutingPurchase, setIsExecutingPurchase] = useState(false);

  const web3Account = useAccount();

  const purchaseTokenBalance = useReadContract({
    abi: erc20Abi,
    address: props.purchaseTokenAddress as Address,
    chainId: wagmiConfig.chain.id,
    functionName: "balanceOf",
    args: [web3Account.address as Address],
    query: {
      enabled: props.isOpen,
    }
  });

  const [referralCode, setReferralCode] = useState("");
  const referralCodeFromQuery = useReferralCodeFromQuery();
  const isCorrectChain = web3Account.chainId === wagmiConfig.chain.id;

  const [enteredAmountText, setEnteredAmountText] = useState("1");
  const enteredAmount = parseInt(enteredAmountText) || 0;

  const [selectedNodeTypeId, setSelectedNodeTypeId] = useState(props.nodeTypes[0].id);
  const selectedNodeType = useMemo(() => {
    return props.nodeTypes.find(x => x.id === selectedNodeTypeId)!;
  }, [props.nodeTypes, selectedNodeTypeId]);

  const getNodeTypeIdName = (nodeTypeId: number) => {
    switch (nodeTypeId) {
      case 1:
        return "Basic";
      case 2:
        return "Pro";
      case 3:
        return "Ultimate";
      default:
        return `Node type id ${nodeTypeId}`;
    }
  }

  const finalPrice = BigInt(enteredAmount) * BigInt(selectedNodeType.currentPricePerNode);

  const maxEnteredAmountPerPurchase = selectedNodeType.limitAtPrice - selectedNodeType.globalPurchasedCount;
  const isEnteredAmountValid = enteredAmount > 0 && enteredAmount <= maxEnteredAmountPerPurchase;
  const isInsufficientBalance =
    isEnteredAmountValid && (purchaseTokenBalance.data == null || purchaseTokenBalance.data < finalPrice);

  const [condition1Accepted, setCondition1Accepted] = useState(false);
  const [condition2Accepted, setCondition2Accepted] = useState(false);

  const uiDisabled = isExecutingPurchase || !isCorrectChain;
  const isReferralCodeValid = !props.referralCodeRequired || referralCode.trim().length >= 3;
  const purchaseButtonDisabled =
    uiDisabled || !isReferralCodeValid || !isEnteredAmountValid || isInsufficientBalance || !condition1Accepted || !condition2Accepted;

  useEffect(() => {
    if (!props.isOpen || !referralCodeFromQuery.loaded)
      return;

    console.log("Using ref code from link: " + referralCodeFromQuery.referralCode);
    setReferralCode(referralCodeFromQuery.referralCode ?? "");
  }, [props.isOpen, referralCodeFromQuery.loaded, referralCodeFromQuery.referralCode]);

  const onAmountTextChanged = (valueText: string) => {
    let value: number | null = parseInt(valueText);
    if (value && value > maxEnteredAmountPerPurchase) {
      //value = maxEnteredAmountPerPurchase;
    }

    setEnteredAmountText(!isNaN(value) ? value.toString() : "");
  }

  const onClose = () => {
    if (isExecutingPurchase)
      return false;

    setEnteredAmountText("1");
    setReferralCode("");
    props.onClose();
  }

  const onPurchaseSucceeded = async () => {
    toast.success("Purchased DistriBrain Engines successfully.");

    if (props.purchasedCallback) {
      await props.purchasedCallback();
    }
  }

  return <>
    <Modal
      show={props.isOpen}
      onHide={onClose}
      backdrop={isExecutingPurchase ? "static" : true}
      centered
      data-rk=""
    >
      <Modal.Header closeButton>
        <Modal.Title><StarIcon className="me-2"/>Purchase DistriBrain Engines</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Stack gap={2}>
          {(web3Account.isConnected && isCorrectChain) && <>
              {showNodeTypesSelection && <>
                  <FloatingLabel
                      controlId="purchase-node-type"
                      label="Node Type"
                  >
                      <Form.Select
                          required
                          value={selectedNodeTypeId}
                          onChange={e => setSelectedNodeTypeId(parseInt(e.currentTarget.value))}
                      >
                        {props.nodeTypes.map((nodeType) =>
                          <option
                            key={`purchase-node-type-id-${nodeType.id}`}
                            value={nodeType.id}>
                            {getNodeTypeIdName(nodeType.id)}
                          </option>
                        )}
                      </Form.Select>
                  </FloatingLabel>
              </>}

              <FloatingLabel
                  controlId="purchase-amount"
                  label="DistriBrain Engines to buy *"
              >
                  <Form.Control
                      required
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={Number(maxEnteredAmountPerPurchase)}
                      isInvalid={!isEnteredAmountValid}
                      disabled={uiDisabled}
                      value={enteredAmountText}
                      onChange={e => onAmountTextChanged(e.currentTarget.value)}
                      className={classes.prettyInput}
                  />
                  <Form.Control.Feedback type="invalid">
                    {maxEnteredAmountPerPurchase > 0 && <>
                        Amount must be between 1 and {uiIntNumberNiceFormat(maxEnteredAmountPerPurchase)}.
                    </>}
                  </Form.Control.Feedback>
              </FloatingLabel>

              <FloatingLabel
                  controlId="purchase-refcode"
                  label={`Referral Code${props.referralCodeRequired ? ' *' : ''}`}
              >
                  <Form.Control
                      required={props.referralCodeRequired}
                      autoComplete="off"
                      disabled={uiDisabled}
                      maxLength={20}
                      isInvalid={!isReferralCodeValid}
                      value={referralCode}
                      onChange={e => setReferralCode(e.currentTarget.value)}
                      className={`${classes.prettyInput} text-uppercase`}
                  />
              </FloatingLabel>

              <Stack direction="vertical" gap={2} className="fs-5 mb-2">
                <span>
                    Price per Engine: {uiFloatNumberNiceFormat(calculateFormattedTokenPrice(selectedNodeType.currentPricePerNode, props.purchaseTokenDecimals))} USDT
                </span>

                {isEnteredAmountValid && <span>
                    Purchase Total: {uiFloatNumberNiceFormat(calculateFormattedTokenPrice(finalPrice, props.purchaseTokenDecimals))} USDT
                </span>}
              </Stack>

              <InputGroup>
                  <Form.Check
                      type="checkbox"
                      disabled={uiDisabled}
                      checked={condition1Accepted}
                      onChange={e => setCondition1Accepted(e.target.checked)}
                      label={<>
                        I have read and accepted the <a
                        href={routes.legal.privacyPolicy()}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Privacy Policy
                      </a> and <a
                        href={routes.legal.termsAndConditions()}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Terms & Conditions
                      </a>.
                      </>}
                      className="pe-2"
                      id="purchase-modal-acknowledge1-check"
                  />
              </InputGroup>

              <InputGroup>
                  <Form.Check
                      type="checkbox"
                      disabled={uiDisabled}
                      checked={condition2Accepted}
                      onChange={e => setCondition2Accepted(e.target.checked)}
                      label="I acknowledge this purchase is not to be considered an investment."
                      className="pe-2"
                      id="purchase-modal-acknowledge2-check"
                  />
              </InputGroup>

              <NodesPurchaseButton
                  nodeTypeId={selectedNodeType.id}
                  amount={enteredAmount}
                  referralCode={referralCode}
                  disabled={purchaseButtonDisabled}
                  disabledText={(!uiDisabled && isInsufficientBalance) ? `Insufficient USDT Balance` : null}
                  onPurchaseFailed={async () => {
                  }}
                  onPurchaseSucceeded={() => onPurchaseSucceeded()}
                  isExecutingPurchase={isExecutingPurchase}
                  setIsExecutingPurchase={(val) => setIsExecutingPurchase(val)}
              />
          </>}

          <Stack className="web3-connect-button-wrapper">
            <ConnectButton showBalance={false}/>
          </Stack>
        </Stack>
      </Modal.Body>
    </Modal>
  </>
}