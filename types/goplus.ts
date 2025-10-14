export type GoPlusAddressSecurityResponse = {
  code: number;
  message: string;
  result?: GoPlusAddressSecurityResult | Record<string, unknown>;
};

export type GoPlusAddressSecurityResult = {
  address?: string;
  chain_id?: string;
  is_contract?: string;
  security_level?: string;
  risk_score?: string;
  risk_list?: string[];
  tags?: string[];
  phishing_site?: string[];
  malicious_behavior?: string[];
  // GoPlus returns numbers as strings; capture unknown extras.
  [key: string]: unknown;
};
