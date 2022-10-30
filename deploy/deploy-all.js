module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployer, vault} = await getNamedAccounts();

    let lock = await deployments.deploy('SUNT', {
        from: deployer,
        log: true,
    });
    const sunt = lock.address;

    lock = await deployments.deploy('Trade', {
        from: deployer,
        log: true,
        args: [sunt, vault]
    });
    const trade = lock.address;

    await deployments.deploy('Router', {
        from: deployer,
        log: true,
        args: [trade]
    });
};
module.exports.tags = ['all'];
