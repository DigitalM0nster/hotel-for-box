export type ISvg = React.FC<React.SVGProps<SVGSVGElement>>;

export interface IUserMenuItem {
    name: string;
    title: string;
    Ico: ISvg;
}

export interface IUserProfileMenuItem {
    title: string;
    name: string;
}

export type IResultType = "success" | "warning" | "error";
export interface IActionResult {
    type: IResultType;
    message: string;
}
