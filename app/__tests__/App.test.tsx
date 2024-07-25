import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import Home from "@/app/page";
// import App from '../renderer/App';

describe("App", () => {
  it("should render", () => {
    expect(render(<Home />)).toBeTruthy();
  });
});
