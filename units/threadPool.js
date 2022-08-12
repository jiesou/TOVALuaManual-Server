module.exports = class ThreadPool {
    options = {
        threads: 1,
        autoRetry: false,
        onFinished: (results) => {
            return results;
        }
    };
    pool = [];
    running = 0;
    finished = [];

    constructor(options) {
        this.options = options;
    }

    addTask(data, task) {
        this.pool.push({
            data: data,
            task: task
        });
    }

    run() {
        // 如果已全部完成，则回调
        if (this.finished.length >= this.pool.length) {
            this.options.onFinished(this.finished);
        } else {
            let offset = this.finished.length + this.running;
            let canDo = this.options.threads - this.running;
            if (canDo > 0) {
                for (let i = offset; i < offset + canDo; i++) {
                    this._runOne(this.pool[i].data, this.pool[i].task);
                }
            }
        }
    }

    _runOne(data, task) {
        this.running++;
        console.log(`Task started ${this.running}/${this.options.threads}`);
        // 启动一个线程，开始任务
        task(data).then((result) => {
            this.running--;
            console.log(`Task finished ${this.running}/${this.options.threads}`);
            this.finished.push(result);
            this.run();
        }).catch(() => {
            if (this.options.autoRetry) {
                // 自动重试
                console.log(`Task failed, retrying...`);
                this._runOne(data, task);
            }
        });
    }

}