const chai = require("chai");
const { ethers, deployments} = require("hardhat");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;

describe("Trust ecosystem test", function () {
    let usdt, router;
    let owner, alice, bob, carl, eve;

    it('Deploy contracts', async () => {
        [owner, alice, bob, carl, eve] = await ethers.getSigners();
        await deployments.fixture();

        usdt = await ethers.getContract("MockERC20");
        router = await ethers.getContract("Router");

        // send to alice and bob
        await usdt.connect(owner).transfer(alice.address, 1000000);
        await usdt.connect(owner).transfer(bob.address, 1000000);
    });

    it("Check router works correctly", async () => {
        await usdt.connect(owner).approve(router.address, 2000);
        await router.connect(owner).setSigner(owner.address);

        const messageHash = ethers.utils.solidityKeccak256(
        ['address', 'address', 'uint256', 'address[]', 'uint256[]', 'uint256', 'uint256'],
        [owner.address, usdt.address, 1, [carl.address, eve.address], [1000, 1000], 2000, 0]
        )
        let good_sign = await owner.signMessage(ethers.utils.arrayify(messageHash));
        let bad_sig = await alice.signMessage(ethers.utils.arrayify(messageHash));
        // bad input arrays
        await expect(router.connect(owner).routTokens(usdt.address, 1, [carl.address, eve.address], [1000], 2000, 0, good_sign))
            .to.be.revertedWith("Router::routTokens: bad input arrays dimension");

        // bad sum
        await expect(router.connect(owner).routTokens(usdt.address, 1, [carl.address, eve.address], [1000, 1000], 1500, 0, good_sign))
            .to.be.revertedWith("Router::routTokens: values sum != amount");

        await expect(router.connect(owner).routTokens(usdt.address, 1, [carl.address, eve.address], [1000, 1000], 2000, 0, bad_sig))
            .to.be.revertedWith("Router::routTokens: signature is invalid");

        await router.connect(owner).routTokens(usdt.address, 1, [carl.address, eve.address], [1000, 1000], 2000, 0, good_sign);
        const carl_balance = await usdt.balanceOf(carl.address);
        const eve_balance = await usdt.balanceOf(eve.address);

        expect(carl_balance.toString()).to.be.eq('1000');
        expect(eve_balance.toString()).to.be.eq('1000');

        await expect(router.connect(owner).routTokens(usdt.address, 1, [carl.address, eve.address], [1000, 1000], 2000, 0, good_sign))
            .to.be.revertedWith("Router::routTokens: deduplication fail");
    });
});
