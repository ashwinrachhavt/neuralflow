export default function BoardLayout({ children, overlay }: { children: React.ReactNode; overlay: React.ReactNode }) {
  return (
    <>
      {children}
      {overlay}
    </>
  );
}

