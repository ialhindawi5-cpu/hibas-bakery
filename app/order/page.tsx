import type { Metadata } from "next";
import { headers } from "next/headers";
import OrderForm from "../components/OrderForm";
import ActiveOrders from "../components/ActiveOrders";
import { getSettings, getMenu, getQuestions } from "../lib/content";
import { getActiveOrdersByIp } from "../lib/orders";
import { clientIpFromHeaders } from "../lib/rateLimit";

export const metadata: Metadata = {
  title: "Order",
  description: "Place an order request. Choose your treats, pickup date and time.",
};

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const [settings, menu, questions] = await Promise.all([
    getSettings(),
    getMenu({ activeOnly: true }),
    getQuestions({ activeOnly: true }),
  ]);

  // The visitor's own active orders (matched by their submitting IP).
  const ip = clientIpFromHeaders(await headers());
  const activeOrders = await getActiveOrdersByIp(ip);

  const menuOptions = menu.map((m) => m.name);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <p className="eyebrow">Place your order</p>
          <h1>Order Request</h1>
          <p>
            After you submit, the bakery will contact you about details and
            availability. For faster service, call {settings.phoneDisplay} or
            message{" "}
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer">
              {settings.instagramHandle}
            </a>{" "}
            on Instagram.
          </p>
        </div>
      </div>

      <section>
        <div className="container">
          <OrderForm
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

          <ActiveOrders orders={activeOrders} />
        </div>
      </section>
    </>
  );
}
