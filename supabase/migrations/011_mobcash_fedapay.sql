-- Add FedaPay tracking columns to mobcash_requests

ALTER TABLE mobcash_requests
  ADD COLUMN IF NOT EXISTS fedapay_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS fedapay_payout_id      TEXT,
  ADD COLUMN IF NOT EXISTS fedapay_status         TEXT;

COMMENT ON COLUMN mobcash_requests.fedapay_transaction_id IS 'FedaPay Transaction ID for deposits (collection)';
COMMENT ON COLUMN mobcash_requests.fedapay_payout_id      IS 'FedaPay Payout ID for withdrawals';
COMMENT ON COLUMN mobcash_requests.fedapay_status         IS 'Raw FedaPay status (approved, declined, etc.)';

CREATE INDEX IF NOT EXISTS idx_mobcash_fedapay_transaction ON mobcash_requests (fedapay_transaction_id) WHERE fedapay_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mobcash_fedapay_payout      ON mobcash_requests (fedapay_payout_id)      WHERE fedapay_payout_id      IS NOT NULL;
