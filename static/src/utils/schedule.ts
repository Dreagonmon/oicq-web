type Task = TimerHandler;

export const scheduleIntervalTask = (task: Task, interval: number) => {
    let handle: number | undefined;
    return {
        start: () => {
            if (handle !== undefined) {
                clearInterval(handle);
            }
            handle = setInterval(task, interval);
        },
        stop: () => {
            if (handle !== undefined) {
                clearInterval(handle);
                handle = undefined;
            }
        },
    };
};

export const scheduleTimeoutTask = (task: Task, interval: number) => {
    let handle: number | undefined;
    return {
        start: () => {
            if (handle !== undefined) {
                clearTimeout(handle);
            }
            handle = setTimeout(task, interval);
        },
        stop: () => {
            if (handle !== undefined) {
                clearTimeout(handle);
                handle = undefined;
            }
        },
    };
};
