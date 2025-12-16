import { IActionResult } from "@/types/types";
import { toast } from "react-toastify";

export const toastShowResult = (res: IActionResult) => {
    toast[res.type](res.message);
    return res;
};
