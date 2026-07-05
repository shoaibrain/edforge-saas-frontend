import { describe, expect, it } from "vitest";
import { I18N_RESOURCES } from "./config";

describe("payments copy boundaries", () => {
  it("keeps fee structure amount headers currency-neutral", () => {
    expect(I18N_RESOURCES.en.payments.feeStructure.amount).toBe("Amount");
    expect(I18N_RESOURCES.ne.payments.feeStructure.amount).toBe("रकम");
    expect(I18N_RESOURCES.hi.payments.feeStructure.amount).toBe("राशि");
  });
});
