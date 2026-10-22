# Author - Viraj Purandare
# Created On - September 30, 2025

# Default packages
import os
import sys
import logging
from dotenv import load_dotenv

# Global variables
SCRIPT_PATH = os.path.dirname(__file__)
DB_MODELS_PATH = os.path.join(SCRIPT_PATH, "database")

sys.path.append(DB_MODELS_PATH)

vault_type_file = os.path.join(SCRIPT_PATH, "config", ".vault_type")
load_dotenv(vault_type_file)
VAULT_TYPE = os.getenv("VAULT_TYPE")

# Custom packages
import db_models
from vault import Vault

from pro_logger import log_event, audit_logger, application_logger

# Retrieve ITSM connector configuration with secrets filtered by ITSM tag
def get_itsm_connector_details_with_creds(db_session, itsm_tag):

    try:
        response = db_session.query(db_models.ITSMConnectorInventory).filter(db_models.ITSMConnectorInventory.itsm_tag == itsm_tag).first()
        
        # Retrieve secret from vault
        vault_obj = Vault(VAULT_TYPE)
        (status, value) = vault_obj.read_secret(f"{itsm_tag}_secret")
   
        # Application logging is taken care in vault code here. Hence, not re-logging.
        if not status:
            return

        response.itsm_user = value[0]
        response.itsm_password = value[1]
        return response
    except Exception as e:
        # Application logging
        log_event(application_logger,
                  logging.ERROR,
                  f"ITSM connector details retrieval failed - {str(e)}",
                  is_exception = True,
                  module_name = "administration",
                  component_type = "db_operations",
                  component_name = "core_crud - get_itsm_connector_details_with_details")

        return

# Retrieve SSO client configuration filtered by client ID and realm name with secrets
def get_sso_client_details_with_creds(db_session, client_id, realm_name):
    try:
        response = db_session.query(db_models.SSOClientInventory).filter(db_models.SSOClientInventory.client_id == client_id,
                                                                         db_models.SSOClientInventory.realm_name == realm_name).first()

        # Retrieve secret from vault
        vault_obj = Vault(VAULT_TYPE)
        (status, value) = vault_obj.read_secret(f"{realm_name}_{client_id}_secret")

        # Application logging is taken care in vault code here. Hence, not re-logging.
        if not status:
            return

        response.client_secret = value[1]
        return response
    except Exception as e:
        # Application logging
        log_event(application_logger,
                  logging.ERROR,
                  f"SSO client details retrieval failed - {str(e)}",
                  is_exception = True,
                  module_name = "administration",
                  component_type = "db_operations",
                  component_name = "core_crud - get_sso_client_details_with_creds")

        return
