import { apiRequest, isApiConfigured } from "./apiClient";

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeError(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return new Error(error.message);
  }

  return new Error(fallbackMessage);
}

export async function loginUser({ email, senha }) {
  if (!isApiConfigured()) {
    await delay(450);

    return {
      mode: "mock",
      message: "Login validado localmente. Configure API_BASE_URL para usar API real.",
      user: { email },
      token: "mock-token",
    };
  }

  try {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: senha }),
    });

    return {
      mode: "api",
      message: "Login realizado com sucesso.",
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, "Nao foi possivel realizar login.");
  }
}

export async function registerUser(values) {
  if (!isApiConfigured()) {
    await delay(550);

    return {
      mode: "mock",
      message: "Cadastro validado localmente. Configure API_BASE_URL para usar API real.",
      user: { email: values.email, name: values.name },
    };
  }

  const payload = {
    name: values.name,
    email: values.email,
    celphone: values.celphone.replace(/\D/g, ""),
    cpf: values.cpf.replace(/\D/g, ""),
    cnh: values.cnh.replace(/\D/g, ""),
    address: values.address,
    cep: values.cep.replace(/\D/g, ""),
    password: values.password,
  };

  try {
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      mode: "api",
      message: "Cadastro enviado com sucesso.",
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, "Nao foi possivel concluir o cadastro.");
  }
}

export async function requestPasswordReset({ email }) {
  if (!isApiConfigured()) {
    await delay(450);

    return {
      mode: "mock",
      message: "Se o e-mail existir, enviaremos um link de recuperacao.",
      email,
    };
  }

  try {
    const result = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    return {
      mode: "api",
      message: "Solicitacao de recuperacao enviada com sucesso.",
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, "Nao foi possivel solicitar recuperacao de senha.");
  }
}