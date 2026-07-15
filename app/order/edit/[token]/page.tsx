import type { Metadata } from "next";
import Link from "next/link";
import OrderForm from "../../../components/OrderForm";
import { getSettings, getMenu, getQuestions } from "../../../lib/content";
import { getOrderByToken } from "../../../lib/orders";
import { isEditable, editDeadline } from "../../../lib/orderBuild";

export const metadata: Metadata = {
  title: "Edit your order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  const settings = await getSettings();

  // Shared page shell so every state looks consistent with the site.
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <>
      <div className="page-header">
        <div className="container">
          <p className="eyebrow">Your order</p>
          <h1>Edit Order</h1>
        </div>
      </div>
      <section>
        <div className="container">{children}</div>
      </section>
    </>
  );

  if (!order) {
    return (
      <Shell>
        <div className="form-card">
          <div className="notice-box">
            <strong>We couldn&apos;t find that order.</strong>
            <p>
              The link may be incorrect or the order may have been removed. For help, call{" "}
              <strong>{settings.phoneDisplay}</strong>.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  if (order.status === "cancelled") {
    return (
      <Shell>
        <div className="form-card">
          <div className="notice-box">
            <strong>This order was cancelled.</strong>
            <p>
              If you&apos;d like to order again, call <strong>{settings.phoneDisplay}</strong> or{" "}
              <Link href="/order">place a new order →</Link>.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  if (!isEditable(order.createdAt)) {
    const closed = new Date(editDeadline(order.createdAt)).toLocaleString([], {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    return (
      <Shell>
        <div className="form-card">
          <div className="notice-box">
            <strong>This order can no longer be edited online.</strong>
            <p>
              Orders can be changed for up to 3 hours after submitting (this one closed at{" "}
              {closed}). To make changes, please call <strong>{settings.phoneDisplay}</strong>{" "}
              or message us on{" "}
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer">
                {settings.instagramHandle}
              </a>
              .
            </p>
            <p>
              <Link href="/order">Place a new order →</Link>
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  const [menu, questions] = await Promise.all([
    getMenu({ activeOnly: true }),
    getQuestions({ activeOnly: true }),
  ]);
  const menuOptions = menu.map((m) => m.name);
  const form = order.formState || { values: {}, qty: {} };

  return (
    <Shell>
      <OrderForm
        mode="edit"
        editToken={order.editToken}
        editUntil={editDeadline(order.createdAt)}
        initialValues={form.values}
        initialQty={form.qty}
        questions={questions}
        menuOptions={menuOptions}
        pickup={settings.pickup}
        phoneDisplay={settings.phoneDisplay}
        whatsappNumber={settings.phoneLink}
        successTitle={settings.orderSuccessTitle}
        successMessage={settings.orderSuccessMessage}
        pickupSlots={settings.pickupSlots || []}
        blockedDates={settings.blockedDates || []}
      />
    </Shell>
  );
}
