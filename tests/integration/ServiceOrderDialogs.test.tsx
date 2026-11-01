import { describe, expect, it, vi } from "vitest";

import ServiceOrderPostponeDialog from "@/components/ServiceOrderPostponeDialog";
import ServiceOrderStartPrompt from "@/components/ServiceOrderStartPrompt";
import ServiceOrderTechnicianDialog from "@/components/ServiceOrderTechnicianDialog";
import { PLACEHOLDER_TECHNICIANS } from "@/data/serviceOrdersPlaceholder";
import { todayInputValue } from "@/schemas/serviceOrders";
import type { ServiceOrderItem } from "@/types/serviceOrders";

import { renderWithProviders, screen, waitFor } from "../test-utils";

const ITEM: ServiceOrderItem = {
  id: "OS-2026-0038",
  productName: "Bloco IPv4 /24",
  status: "pending",
  address: "Digital (LACNIC/ANATEL)",
  scheduledAt: "2030-01-05T12:00:00.000Z",
  slaDeadline: "2030-01-10T12:00:00.000Z",
  updatedAt: "2026-07-06T14:00:00.000Z",
  evidences: [{}, {}],
  reschedulesUsed: 0,
  reschedulesAllowed: 3,
  amount: { amount: 4420.04, currency: "USD" },
  messages: [],
};

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return todayInputValue(date);
};

describe(
  "ServiceOrderTechnicianDialog (Figma 2968-69041 / 2968-70259)",
  { timeout: 20_000 },
  () => {
    it("escolhe um técnico cadastrado", async () => {
      const onConfirm = vi.fn();
      const { user } = renderWithProviders(
        <ServiceOrderTechnicianDialog
          item={ITEM}
          technicians={PLACEHOLDER_TECHNICIANS}
          isPending={false}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />,
      );

      const confirm = await screen.findByRole("button", {
        name: "ServiceOrders.technician.confirmAdd",
      });
      expect(confirm).toBeDisabled();

      await user.click(screen.getByRole("radio", { name: /Ricardo Mendes/ }));
      await user.click(confirm);

      expect(onConfirm).toHaveBeenCalledWith("tec-2");
    });

    it("cadastra um novo técnico com validação", async () => {
      const onConfirm = vi.fn();
      const { user } = renderWithProviders(
        <ServiceOrderTechnicianDialog
          item={ITEM}
          technicians={PLACEHOLDER_TECHNICIANS}
          isPending={false}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />,
      );

      await user.click(
        await screen.findByRole("tab", {
          name: "ServiceOrders.technician.tabs.new",
        }),
      );
      await user.click(
        screen.getByRole("button", {
          name: "ServiceOrders.technician.confirmAdd",
        }),
      );
      expect(
        await screen.findAllByText("ServiceOrders.errors.required"),
      ).toHaveLength(3);
      expect(onConfirm).not.toHaveBeenCalled();

      await user.type(
        screen.getByLabelText("ServiceOrders.technician.name"),
        "Ana Lima",
      );
      await user.type(
        screen.getByLabelText("ServiceOrders.technician.phone"),
        "85988887777",
      );
      await user.type(
        screen.getByLabelText("ServiceOrders.technician.specialty"),
        "Fibra",
      );
      await user.click(
        screen.getByRole("button", {
          name: "ServiceOrders.technician.confirmAdd",
        }),
      );

      await waitFor(() =>
        expect(onConfirm).toHaveBeenCalledWith({
          name: "Ana Lima",
          phone: "(85) 98888-7777",
          specialty: "Fibra",
        }),
      );
    });
  },
);

describe("ServiceOrderStartPrompt (Figma 2968-72899)", () => {
  it("só adiciona ou já inicia", async () => {
    const onChoose = vi.fn();
    const { user } = renderWithProviders(
      <ServiceOrderStartPrompt
        open
        isPending={false}
        onClose={vi.fn()}
        onChoose={onChoose}
      />,
    );

    await user.click(
      await screen.findByRole("button", {
        name: "ServiceOrders.startPrompt.onlyAdd",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "ServiceOrders.startPrompt.start" }),
    );

    expect(onChoose.mock.calls).toEqual([[false], [true]]);
  });
});

describe(
  "ServiceOrderPostponeDialog (Figma 2968-68398)",
  { timeout: 20_000 },
  () => {
    it("reagendamento exige o motivo e envia a nova previsão", async () => {
      const onConfirm = vi.fn().mockResolvedValue(true);
      const onClose = vi.fn();
      const { user } = renderWithProviders(
        <ServiceOrderPostponeDialog
          item={ITEM}
          isPending={false}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );

      const date = await screen.findByLabelText("ServiceOrders.postpone.date");
      await user.clear(date);
      await user.type(date, tomorrow());
      const time = screen.getByLabelText("ServiceOrders.postpone.time");
      await user.clear(time);
      await user.type(time, "14:30");
      await user.type(
        screen.getByLabelText("ServiceOrders.postpone.reason"),
        "Buyer pediu outro dia",
      );
      await user.click(
        screen.getByRole("checkbox", {
          name: /ServiceOrders.postpone.reschedule/,
        }),
      );

      const submit = screen.getByRole("button", {
        name: "ServiceOrders.postpone.confirm",
      });
      await user.click(submit);
      expect(
        await screen.findByText("ServiceOrders.errors.required"),
      ).toBeInTheDocument();
      expect(onConfirm).not.toHaveBeenCalled();

      await user.selectOptions(
        screen.getByLabelText("ServiceOrders.postpone.rescheduleType"),
        "buyerRequest",
      );
      await user.type(
        screen.getByLabelText("ServiceOrders.postpone.rescheduleReason"),
        "Reforma",
      );
      await user.click(submit);

      await waitFor(() =>
        expect(onConfirm).toHaveBeenCalledWith("OS-2026-0038", {
          scheduledAt: `${tomorrow()}T14:30`,
          reason: "Buyer pediu outro dia",
          reschedule: true,
          rescheduleType: "buyerRequest",
          rescheduleReason: "Reforma",
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  },
);
