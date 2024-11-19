import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Address, erc20Abi } from "viem";
import { toast } from "react-toastify";
import { FloatingLabel, Form, InputGroup, Modal } from "react-bootstrap";
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
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack
} from "@mui/material";
import { X, Plus, Minus } from 'lucide-react';
import Image from "next/image";
import commonTerms from "@/data/commonTerms";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Spinner } from "react-bootstrap";

const showNodeTypesSelection = !!(+process.env.NEXT_PUBLIC_SHOW_NODE_TYPES_SELECTION!);

export interface PurchaseNodesDialogOpenProps {
  referralCodeRequired: boolean;
  nodeTypes: NodesTypePurchaseInfoDto[];
  selectedNodeTypeId: number;
  setSelectedNodeTypeId: (nodeTypeId: number) => void;
  purchaseTokenAddress: string;
  purchaseTokenDecimals: number;
  isOpen: boolean;
  onClose: () => void;
  purchasedCallback: () => Promise<void>;
}

export const PurchaseNodesDialog = (props: PurchaseNodesDialogOpenProps) => {
  const [isExecutingPurchase, setIsExecutingPurchase] = useState(false);
  const { connectModalOpen } = useConnectModal();

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


  const selectedNodeType = useMemo(() => {
    return props.nodeTypes.find(x => x.id === props.selectedNodeTypeId)!;
  }, [props.nodeTypes, props.selectedNodeTypeId]);

  const getNodeTypeIdName = (nodeTypeId: number) => {
    switch (nodeTypeId) {
      case commonTerms.nodeTypeCoreId:
        return "Core";
      case commonTerms.nodeTypePrimeId:
        return "Prime";
      case commonTerms.nodeTypeEliteId:
        return "Elite";
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
    toast.success("Purchased StrikeBit Engines successfully.");

    if (props.purchasedCallback) {
      await props.purchasedCallback();
    }
  }

  const [openDialog, setOpenDialog] = useState(false);


  useEffect(() => {
    if (props.isOpen) {
      setOpenDialog(true);
    }
  }, [props.isOpen]);

  // const handleClickOpen = () => {
  //   setOpenDialog(true);
  // };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const onAmountChanged = (newAmount: string) => {
    // Ensure that the amount stays within the valid range
    if (Number(newAmount) >= 1 && Number(newAmount) <= maxEnteredAmountPerPurchase) {
      setEnteredAmountText(newAmount);
    }
  };

  const increaseAmount = () => {
    if (Number(enteredAmountText) < Number(maxEnteredAmountPerPurchase)) {
      onAmountChanged((Number(enteredAmountText) + 1).toString());
    }
  };

  const decreaseAmount = () => {
    if (Number(enteredAmountText) > 1) {
      onAmountChanged((Number(enteredAmountText) - 1).toString());
    }
  };

  return <>
    <Dialog
      open={props.isOpen}
      onClose={onClose}
      aria-labelledby="purchase-dialog-title"
      aria-describedby="purchase-dialog-description"
      style={{
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(0,0,0,0.5)"
      }}
      className="rounded-0"
      maxWidth="md"
    >
      <div style={{ display: "flex" }}>
        <div style={{}}>
          <DialogTitle
            id="purchase-dialog-title"
            className="bg-dark-gray rounded-0"
            sx={{
              borderRadius: 0,
              color: "white",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            {(web3Account.isConnected && isCorrectChain) ? "Purchase StrikeBit Nodes" : "Connect a Wallet"}
          </DialogTitle>
          <DialogContent className="bg-dark-gray" sx={{ color: "white" }}>
            <Stack gap={2} className="" sx={{}}>
              {(web3Account.isConnected && isCorrectChain) && <>
                {showNodeTypesSelection && (
                  <FormControl
                    variant="filled"
                    fullWidth
                    sx={{
                      color: "white",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderRadius: "0"
                    }}>
                    <InputLabel id="purchase-node-type-label" sx={{ color: "white" }}>Node Type</InputLabel>
                    <Select
                      labelId="purchase-node-type-label"
                      value={props.selectedNodeTypeId}
                      onChange={e => props.setSelectedNodeTypeId(Number(e.target.value))}
                      sx={{
                        color: "white",
                        "& .MuiSelect-icon": {
                          color: "white"
                        },
                      }}
                    >
                      {props.nodeTypes.map(nodeType => (
                        <MenuItem key={`purchase-node-type-id-${nodeType.id}`} value={nodeType.id}>
                          {getNodeTypeIdName(nodeType.id)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <div style={{borderBottom:"1px solid white", marginTop:"20px"}}>
                  <span style={{lineHeight: "10px", display:"flex", justifyContent:"space-between"}}>
                    <p>Price per Node</p>
                    <p style={{fontSize:"20px"}}>{uiFloatNumberNiceFormat(calculateFormattedTokenPrice(selectedNodeType.currentPricePerNode, props.purchaseTokenDecimals))} USDT</p>
                  </span>
                </div>
                <div>
                  <p style={{ fontWeight: 700 }}>StrikeBit Nodes to buy</p>
                  <div
                    style={{
                      position: "relative",
                      color: "white"
                    }}
                  >
                    <Button
                      sx={{
                        position: "absolute",
                        height: "100%",
                        zIndex: "10",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: 0
                      }}
                      onClick={decreaseAmount}
                      disabled={uiDisabled}
                    >
                      <Minus color="white" />
                    </Button>
                    <TextField
                      required
                      fullWidth
                      id="purchase-amount"
                      type="number"
                      slotProps={{
                        htmlInput: {
                          min: 1,
                          max: Number(maxEnteredAmountPerPurchase),
                          pattern: "[0-9]*"
                        }
                      }}
                      error={!isEnteredAmountValid}
                      disabled={uiDisabled}
                      value={enteredAmountText}
                      onChange={e => onAmountTextChanged(e.target.value)}
                      // helperText={maxEnteredAmountPerPurchase > 0 && (
                      //   `Amount must be between 1 and ${uiIntNumberNiceFormat(maxEnteredAmountPerPurchase)}.`
                      // )}
                      sx={{
                        color: "white",
                        textAlign: "center",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        "& .MuiInputBase-input": {
                          textAlign: "center", // Ensure the input text is centered as well
                          color: "white", // Ensure text inside the input is white
                        },
                        "& input[type='number']::-webkit-outer-spin-button": {
                          display: "none",
                        },
                        "& input[type='number']::-webkit-inner-spin-button": {
                          display: "none",
                        },
                        "& input[type='number']": {
                          "-moz-appearance": "textfield", // For Firefox
                        }
                      }}
                      className={classes.prettyInput}
                    />
                    <Button
                      sx={{
                        position: "absolute",
                        right: 0,
                        height: "100%",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: 0
                      }}
                      onClick={increaseAmount}
                      disabled={uiDisabled}
                    >
                      <Plus color="white" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 700 }}>Referral Code{props.referralCodeRequired ? ' *' : ''}</p>
                  <TextField
                    required={props.referralCodeRequired}
                    fullWidth
                    id="purchase-refcode"
                    // label={`Referral Code${props.referralCodeRequired ? ' *' : ''}`}
                    placeholder={`Referral Code${props.referralCodeRequired ? ' *' : ''}`}
                    autoComplete="off"
                    disabled={uiDisabled}
                    slotProps={{
                      input: {
                        inputProps: { maxLength: 20 }
                      },
                      inputLabel: {
                        style: { color: "white" }
                      }
                    }}
                    error={!isReferralCodeValid}
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value)}
                    sx={{
                      color: "white",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      "& input::placeholder": {
                        color: "rgba(255,255,255,0.8)"
                      }
                    }}
                    className={`${classes.prettyInput} text-uppercase`}
                  />
                </div>
                <Stack className="web3-connect-button-wrapper bg-dark-gray">
                  {/* <ConnectButton showBalance={false}/> */}
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openAccountModal,
                      openChainModal,
                      openConnectModal,
                      authenticationStatus,
                      mounted,
                    }) => {
                      // Note: If your app doesn't use authentication, you
                      // can remove all 'authenticationStatus' checks
                      const ready = mounted && authenticationStatus !== 'loading';
                      const connected =
                        ready &&
                        account &&
                        chain &&
                        (!authenticationStatus ||
                          authenticationStatus === 'authenticated');
                      if (!connectModalOpen && !web3Account.isConnected) {
                        onClose();
                      }
                      return (
                        <div
                          {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                              opacity: 0,
                              pointerEvents: 'none',
                              userSelect: 'none',
                            },
                          })}
                          style={{
                            width: "100%"
                          }}
                        >
                          {(() => {
                            if (!connected) {
                              return (
                                <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                                  {/* {openConnectModal && <button onClick={openConnectModal} type="button"
                                  style={{
                                    border: "0",
                                    width: "100%",
                                    padding: "1rem",
                                    color: "white",
                                    backgroundColor: "#1214FD"
                                  }}
                                >
                                  Connect Wallet
                                </button>} */}
                                  <Spinner />
                                </div>
                              );
                            }
                            if (chain?.unsupported) {
                              return (
                                <button onClick={openChainModal} type="button"
                                  style={{
                                    border: "0",
                                    width: "100%",
                                    padding: "1rem",
                                    color: "black",
                                    backgroundColor: "#686868"
                                  }}
                                >
                                  Wrong network
                                </button>
                              );
                            }
                            return (
                              <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                  onClick={openChainModal}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: "center",
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    border: "0",
                                    width: "50%"
                                  }}
                                  type="button"
                                >
                                  {chain?.hasIcon && (
                                    <div
                                    >
                                      {chain?.iconUrl && (
                                        <Image
                                          src={chain?.iconUrl}
                                          alt={chain?.name ?? 'Chain icon'}
                                          height={25}
                                          width={25}
                                        />
                                      )}
                                    </div>
                                  )}
                                  {chain?.name}
                                </button>
                                <button onClick={openAccountModal} type="button"
                                  style={{
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    border: "0",
                                    width: "50%"
                                  }}
                                >
                                  {account?.displayName}
                                  {account?.displayBalance
                                    ? ` (${account?.displayBalance})`
                                    : ''}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                </Stack>
              </>}
            </Stack>
          </DialogContent>
        </div>
        <div className="bg-blue" style={{ width: "22.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "start", padding: "2rem", color: "white" }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: 'flex-end'
            }}
          >
            <button style={{
              border: "none",
              background: "none",
            }} onClick={onClose}>
              <X />
            </button>
          </div>
          <Stack>
            {isEnteredAmountValid && (
              <span style={{ lineHeight: "15px" }}>
                <p style={{ fontSize: "20px" }}>Purchase Total</p>
                <p style={{ fontSize: "48px" }}>{uiFloatNumberNiceFormat(calculateFormattedTokenPrice(finalPrice, props.purchaseTokenDecimals))} USDT</p>
              </span>
            )}
          </Stack>
          <div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={condition1Accepted}
                  onChange={e => setCondition1Accepted(e.target.checked)}
                  disabled={uiDisabled}
                  id="purchase-modal-acknowledge1-check"
                />
              }
              label={<div style={{ fontSize: "10px" }}>
                I have read and accepted the <a href={routes.legal.privacyPolicy()} target="_blank" rel="noreferrer">Privacy Policy</a> and <a href={routes.legal.termsAndConditions()} target="_blank" rel="noreferrer">Terms & Conditions</a>.
              </div>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={condition2Accepted}
                  onChange={e => setCondition2Accepted(e.target.checked)}
                  disabled={uiDisabled}
                  id="purchase-modal-acknowledge2-check"
                />
              }
              label={<div style={{ fontSize: "10px" }}>I acknowledge this purchase is not to be considered an investment.</div>}
            />
            <NodesPurchaseButton
              nodeTypeId={selectedNodeType.id}
              amount={enteredAmount}
              referralCode={referralCode}
              disabled={purchaseButtonDisabled}
              disabledText={(!uiDisabled && isInsufficientBalance) ? `Insufficient USDT Balance` : null}
              onPurchaseFailed={async () => { }}
              onPurchaseSucceeded={() => onPurchaseSucceeded()}
              isExecutingPurchase={isExecutingPurchase}
              setIsExecutingPurchase={val => setIsExecutingPurchase(val)}
            />
          </div>
        </div>
      </div>
    </Dialog>
    {/* <Modal
      show={props.isOpen}
      onHide={onClose}
      backdrop={isExecutingPurchase ? "static" : true}
      centered
      data-rk=""
    >
      <Modal.Header closeButton>
        <Modal.Title><StarIcon className="me-2"/>Purchase StrikeBit Engines</Modal.Title>
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
    </Modal> */}
  </>
}