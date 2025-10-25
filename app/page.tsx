export default function HomePage() {
  return (
    <s-page heading="Collectify" inlineSize="large">
      <s-stack direction="block" gap="large" padding="large">
        {" "}
        <s-box
          padding="large"
          background="base"
          border="base"
          borderRadius="large"
        >
          <div className=" flex flex-col items-center justify-center gap-5">
            <img
              src="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              alt="Empty State"
            />
            <s-heading>Create Collections with Easy CSV Import</s-heading>
            <s-button-group>
              <s-button
                variant="primary"
                slot="primary-action"
                href="/collections"
              >
                Handle Collections
              </s-button>
              <s-button
                variant="secondary"
                slot="secondary-actions"
                href="/plan"
              >
                View Plans
              </s-button>
            </s-button-group>
          </div>
        </s-box>
      </s-stack>
    </s-page>
  );
}
