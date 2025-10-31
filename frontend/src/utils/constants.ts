export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_NAME = 'Sepolia';

export const ZAMA_RELAYER_URL = 'https://relayer.testnet.zama.cloud';

// Zama Sepolia Contract Addresses
export const ZAMA_VERIFYING_CONTRACT = '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F';
export const ZAMA_KMS_CONTRACT = '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC';
export const ZAMA_ACL_CONTRACT = '0x687820221192C5B662b25367F70076A37bc79b6c';

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

export const INVOICE_MANAGER_ABI = [
  "event InvoiceCreated(uint256 indexed invoiceId, address indexed sender, address indexed recipient, string description, uint256 dueDate, uint256 createdAt)",
  "event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 paidAt)",
  "event InvoiceCancelled(uint256 indexed invoiceId, address indexed canceller, uint256 cancelledAt)",
  "function createInvoice(address _recipient, string memory _description, bytes memory _encryptedAmount, bytes calldata _inputProof, uint256 _amountInWei, uint256 _dueDate) external returns (uint256)",
  "function payInvoice(uint256 _invoiceId) external payable",
  "function cancelInvoice(uint256 _invoiceId) external",
  "function getEncryptedAmount(uint256 _invoiceId) external view returns (uint256)",
  "function getInvoiceDetails(uint256 _invoiceId) external view returns (uint256 id, address sender, address recipient, string memory description, uint256 amountInWei, uint256 dueDate, uint8 status, uint256 createdAt, uint256 paidAt)",
  "function getSentInvoices(address _sender) external view returns (uint256[] memory)",
  "function getReceivedInvoices(address _recipient) external view returns (uint256[] memory)",
  "function getTotalInvoices() external view returns (uint256)"
];
