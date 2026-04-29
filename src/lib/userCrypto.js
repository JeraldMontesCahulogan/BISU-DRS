// src/lib/userCrypto.js
import { encryptText, decryptText } from "@/lib/crypto";

export async function decryptUserRow(row) {
  if (!row) return row;

  return {
    ...row,
    email: row.email ? await decryptText(row.email) : null,
    student_id: row.student_id ? await decryptText(row.student_id) : null,
    firstname: row.firstname ? await decryptText(row.firstname) : null,
    middlename: row.middlename ? await decryptText(row.middlename) : null,
    lastname: row.lastname ? await decryptText(row.lastname) : null,
  };
}

export async function decryptUserRows(rows) {
  return Promise.all((rows || []).map((row) => decryptUserRow(row)));
}

export async function encryptUserUpdateFields(updates = {}) {
  const next = { ...updates };

  if (Object.prototype.hasOwnProperty.call(next, "email")) {
    next.email = next.email
      ? await encryptText(String(next.email).trim().toLowerCase())
      : null;
  }

  if (Object.prototype.hasOwnProperty.call(next, "student_id")) {
    next.student_id = next.student_id
      ? await encryptText(String(next.student_id).trim())
      : null;
  }

  if (Object.prototype.hasOwnProperty.call(next, "firstname")) {
    next.firstname = next.firstname
      ? await encryptText(String(next.firstname).trim())
      : null;
  }

  if (Object.prototype.hasOwnProperty.call(next, "middlename")) {
    next.middlename = next.middlename
      ? await encryptText(String(next.middlename).trim())
      : null;
  }

  if (Object.prototype.hasOwnProperty.call(next, "lastname")) {
    next.lastname = next.lastname
      ? await encryptText(String(next.lastname).trim())
      : null;
  }

  return next;
}
