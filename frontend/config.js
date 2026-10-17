// 1) Deploy the contract in Remix on Sepolia  2) Paste its address below
export const CONTRACT_ADDRESS = "0x46aB62429Cc0963c874723b33e78bE81B19e13A1";

// Public Sepolia RPC so people can VIEW reports without connecting a wallet
export const READ_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

export const ABI = [
  "function reportItem(string name, string description, string location, bool isFound) returns (uint256)",
  "function getItem(uint256 id) view returns (tuple(uint256 id, string name, string description, string location, bool isFound, address reporter, uint256 timestamp, bool recovered))",
  "function getAllItems() view returns (tuple(uint256 id, string name, string description, string location, bool isFound, address reporter, uint256 timestamp, bool recovered)[])",
  "function markRecovered(uint256 id)",
  "event ItemReported(uint256 indexed id, address indexed reporter, string name, bool isFound)",
  "event ItemRecovered(uint256 indexed id, address indexed reporter)"
];
