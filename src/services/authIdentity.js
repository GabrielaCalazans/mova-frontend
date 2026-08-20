function normalizeCargoValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === "LOCADOR" || normalized === "LOCATARIO") {
    return normalized;
  }

  return "";
}

export function normalizeCargo(value) {
  return normalizeCargoValue(value);
}

export function getUserCargo(user) {
  if (!user) {
    return "";
  }

  return normalizeCargoValue(user.cargo || user.profileType);
}

export function isLocador(user) {
  return getUserCargo(user) === "LOCADOR";
}

export function isLocatario(user) {
  return getUserCargo(user) === "LOCATARIO";
}

export function resolveAuthRoute(user) {
<<<<<<< HEAD
  return isLocador(user) ? "/conta" : "/home";
}
=======
  return isLocador(user) ? "/conta" : "/tipos-carros";
}
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
