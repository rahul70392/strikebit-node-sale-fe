if (!process.env.NEXT_PUBLIC_EVM_BLOCK_EXPLORER_TRANSACTION_HASH_TEMPLATE)
  throw new Error("NEXT_PUBLIC_EVM_BLOCK_EXPLORER_TRANSACTION_HASH_TEMPLATE must be set")

if (!process.env.NEXT_PUBLIC_EVM_BLOCK_EXPLORER_ADDRESS_TEMPLATE)
  throw new Error("NEXT_PUBLIC_EVM_BLOCK_EXPLORER_ADDRESS_TEMPLATE must be set")

export const routes = {
  makeAbsoluteUri: (relativeUri: string) => window.location.protocol + "//" + window.location.host + relativeUri,

  home: () => "/",
  login: () => "/login",

  legal: {
    termsAndConditions: () => "https://docs.dropletsocial.com/terms-and-conditions",
    privacyPolicy: () => "https://docs.dropletsocial.com/privacy-policy",
  },

  docs: {
    dePin: () => "https://docs.dropletsocial.com/droplet-ecosystem/droplet-depin"
  },

  evmBlockExplorer: {
    transaction: (transactionHash: string) =>
      process.env.NEXT_PUBLIC_EVM_BLOCK_EXPLORER_TRANSACTION_HASH_TEMPLATE!
        .replace("{txId}", transactionHash),
    address: (address: string) =>
      process.env.NEXT_PUBLIC_EVM_BLOCK_EXPLORER_ADDRESS_TEMPLATE!
        .replace("{address}", address)
  }
};
