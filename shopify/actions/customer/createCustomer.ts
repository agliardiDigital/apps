import { AppContext } from "../../mod.ts";
import { Data, Variables, query } from "../../utils/queries/createCustomer.ts";

type CreateCustomerProps = {
  input: {
    email: string;
    emailMarketingConsent : {
      consentUpdatedAt?: string;
      marketingOptInLevel?: string;
      marketingState: string;
    }
    tags: string[];
  };
};

const action = async (
  { input }: CreateCustomerProps,
  _req: Request,
  ctx: AppContext,
): Promise<Data['payload']['customer']> => {
  const { admin } = ctx;

  const { payload : {customer} }  = await admin.query<Data, Variables>({
    variables: { 
      input:{
        email: input.email,
        emailMarketingConsent: {
          marketingState: input.emailMarketingConsent.marketingState,
          consentUpdatedAt: input.emailMarketingConsent.consentUpdatedAt,
          marketingOptInLevel: input.emailMarketingConsent.marketingOptInLevel
        },
        tags: input.tags,
      }
    },
    query,
  });

  return customer;
};

export default action;
