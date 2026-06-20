ALTER TABLE companies ADD COLUMN owner_user_id BIGINT;

ALTER TABLE companies ADD CONSTRAINT fk_company_owner
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_companies_owner ON companies(owner_user_id);
