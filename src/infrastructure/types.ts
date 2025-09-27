export type NodeResponse = {
    success: boolean;
};

export type GetResponse = NodeResponse & {
    value?: string;
};
