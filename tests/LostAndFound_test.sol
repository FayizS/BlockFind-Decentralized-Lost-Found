// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "remix_tests.sol";
import "../contracts/LostAndFound.sol";

// A different address (separate contract) used to simulate "another wallet"
contract OtherWallet {
    function tryMark(LostAndFound lf, uint256 id) external {
        lf.markRecovered(id);
    }
}

contract LostAndFoundTest {
    LostAndFound lf;
    OtherWallet other;

    function beforeAll() public {
        lf = new LostAndFound();
        other = new OtherWallet();
    }

    /// VALID: proper name and description
    function testValidReport() public {
        lf.reportItem("Blue Wallet", "Blue leather wallet, no cards", "Library", false);
        LostAndFound.Item memory it = lf.getItem(0);
        Assert.equal(it.name, "Blue Wallet", "name should match");
        Assert.equal(it.reporter, address(this), "reporter should be this contract");
        Assert.equal(it.recovered, false, "should not be recovered");
        Assert.equal(lf.itemCount(), uint256(1), "count should be 1");
    }

    /// INVALID: empty item name
    function testEmptyName() public {
        try lf.reportItem("", "some description", "Canteen", false) {
            Assert.ok(false, "should have reverted");
        } catch Error(string memory reason) {
            Assert.equal(reason, "Item name cannot be empty", "wrong revert reason");
        } catch {
            Assert.ok(false, "unexpected failure");
        }
    }

    /// DUPLICATE: identical report from same wallet
    function testDuplicate() public {
        lf.reportItem("Black Keys", "Keychain with red tag", "Block A", true);
        try lf.reportItem("Black Keys", "Keychain with red tag", "Block A", true) {
            Assert.ok(false, "should have reverted");
        } catch Error(string memory reason) {
            Assert.equal(reason, "Duplicate report", "wrong revert reason");
        } catch {
            Assert.ok(false, "unexpected failure");
        }
    }

    /// UNAUTHORIZED: another wallet tries to mark item 0 recovered
    function testUnauthorizedRecover() public {
        try other.tryMark(lf, 0) {
            Assert.ok(false, "should have reverted");
        } catch Error(string memory reason) {
            Assert.equal(reason, "Only the original reporter can do this", "wrong reason");
        } catch {
            Assert.ok(false, "unexpected failure");
        }
    }

    /// AUTHORIZED: original reporter marks recovered
    function testAuthorizedRecover() public {
        lf.markRecovered(0);
        Assert.equal(lf.getItem(0).recovered, true, "should be recovered");
    }
}
