import { describe, it, expect } from "vitest";
import { toFinderSafePerson, assertNoPhoneExposure, maskPhone } from "@/lib/phone";

describe("finder phone exposure guard", () => {
  const fullPerson = {
    id: "p1",
    firstName: "Zainab",
    photoUrl: null,
    ageGroup: "CHILD",
    status: "ACTIVE",
    // fields that must never leak to a finder:
    guardian: { id: "g1", name: "Umm Zainab", phone: "+919876543210" },
    backupContacts: [{ name: "Uncle", phone: "+919876500000" }],
  };

  it("strips guardian and backup contact phone numbers via the allow-list serializer", () => {
    const safe = toFinderSafePerson(fullPerson);
    expect(safe).toEqual({
      id: "p1",
      firstName: "Zainab",
      photoUrl: null,
      ageGroup: "CHILD",
      status: "ACTIVE",
    });
    expect(JSON.stringify(safe)).not.toContain("+9198");
  });

  it("does not throw for a correctly-serialized finder payload", () => {
    const safe = toFinderSafePerson(fullPerson);
    expect(() => assertNoPhoneExposure(safe)).not.toThrow();
  });

  it("throws if a phone-shaped field accidentally ends up in a finder payload", () => {
    const leaky = { ...toFinderSafePerson(fullPerson), guardianPhone: "+919876543210" };
    expect(() => assertNoPhoneExposure(leaky)).toThrow(/phone/i);
  });

  it("catches a phone number nested deep inside the payload", () => {
    const leaky = {
      meetPoints: [{ name: "Gate 2" }],
      debug: { contact: { phone: "+919876543210" } },
    };
    expect(() => assertNoPhoneExposure(leaky)).toThrow();
  });

  it("masks a phone number for audit logs instead of storing it raw", () => {
    expect(maskPhone("+919876543210")).toBe("+919*****3210");
  });
});
